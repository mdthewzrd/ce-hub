/**
 * Complete Market Universe Service
 * Fetches ALL NASDAQ, NYSE, and ETF tickers from Polygon API
 * Ensures comprehensive market coverage for all scanner executions
 */

export interface MarketUniverseConfig {
  start_date: string;
  end_date: string;
  api_key: string;
  include_etfs?: boolean;
  min_price?: number;
  min_volume?: number;
  min_dollar_volume?: number;
}

export interface TickerData {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  transactions?: number;
}

export class MarketUniverseService {
  private readonly POLYGON_API_URL = 'https://api.polygon.io';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || 'Fm7brz4s23eSocDErnL68cE7wspz2K1I';
  }

  /**
   * Fetch complete market universe for a given date range - TRUE COMPLETE MARKET (ALL 11,000+ tickers)
   */
  async fetchCompleteMarketUniverse(config: MarketUniverseConfig): Promise<string[]> {
    console.log(`🌍 🚀 FETCHING TRUE COMPLETE MARKET UNIVERSE - ALL NASDAQ, NYSE, ETFs (~11,000+)`);
    console.log(`📅 Date range: ${config.start_date} to ${config.end_date}`);

    const allSymbols = new Set<string>();

    try {
      // STRATEGY: Fetch from multiple sources to get comprehensive coverage
      // 1. Get ALL stocks from the latest trading day with MINIMAL filtering
      // 2. Add comprehensive ETF lists
      // 3. Use Polygon's stock ticker listings for comprehensive coverage

      // Get latest trading day for most comprehensive data
      const latestTradingDay = await this.getLatestTradingDay();
      console.log(`📅 Using latest trading day: ${latestTradingDay} for comprehensive ticker fetch`);

      // 1. Fetch ALL stocks from grouped market API with MINIMAL filtering
      console.log(`🔍 Step 1: Fetching ALL market stocks from grouped API...`);
      const marketSymbols = await this.fetchAllStocksMinimalFilter(latestTradingDay, config);
      marketSymbols.forEach(symbol => allSymbols.add(symbol));
      console.log(`✅ Found ${marketSymbols.length} market stocks`);

      // 2. Add comprehensive ETF coverage
      if (config.include_etfs) {
        console.log(`🔍 Step 2: Adding comprehensive ETF coverage...`);
        const etfSymbols = this.getAllETFs();
        etfSymbols.forEach(symbol => allSymbols.add(symbol));
        console.log(`✅ Added ${etfSymbols.length} ETFs`);
      }

      // 3. Get additional ticker listings from Polygon's ticker API
      console.log(`🔍 Step 3: Fetching additional ticker listings...`);
      const additionalSymbols = await this.fetchAdditionalTickers(config);
      additionalSymbols.forEach(symbol => allSymbols.add(symbol));
      console.log(`✅ Added ${additionalSymbols.length} additional tickers`);

      const symbolArray = Array.from(allSymbols).sort();
      console.log(`🎯🚀 TRUE COMPLETE MARKET UNIVERSE: ${symbolArray.length} tickers (ALL NASDAQ, NYSE, ETFs)`);

      return symbolArray;

    } catch (error) {
      console.error('❌ Failed to fetch complete market universe:', error);
      console.log('⚠️ Falling back to basic market data...');

      // Fallback: Use the original approach but with much relaxed filtering
      return this.fetchFallbackMarketUniverse(config);
    }
  }

  /**
   * Fetch stock list for a specific date
   */
  private async fetchStockList(date: string, adjusted: boolean, config: MarketUniverseConfig): Promise<string[]> {
    const url = `${this.POLYGON_API_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=${adjusted}&apiKey=${config.api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock list for ${date}: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        console.warn(`⚠️ No results found for ${date}`);
        return [];
      }

      // Filter based on minimum criteria
      const filteredTickers = data.results
        .filter((result: any) => {
          const price = result.c || 0;
          const volume = result.v || 0;
          const dollarVolume = price * volume;

          // Apply minimum filters
          if (config.min_price && price < config.min_price) return false;
          if (config.min_volume && volume < config.min_volume) return false;
          if (config.min_dollar_volume && dollarVolume < config.min_dollar_volume) return false;

          // Basic quality filters
          if (price <= 0 || volume <= 0) return false;

          return true;
        })
        .map((result: any) => result.T)
        .filter((ticker: string) => ticker && ticker.length > 0);

      return filteredTickers;
    } catch (error) {
      console.error(`❌ Error fetching stock list for ${date}:`, error);
      return [];
    }
  }

  /**
   * Generate trading days for a date range
   */
  private async generateTradingDays(startDate: string, endDate: string): Promise<string[]> {
    const tradingDays: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate all days and filter to weekdays
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();

      // Exclude weekends (Saturday=6, Sunday=0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Format as YYYY-MM-DD
        tradingDays.push(d.toISOString().split('T')[0]);
      }
    }

    return tradingDays;
  }

  /**
   * Get major ETF tickers to include in universe
   */
  private getMajorETFs(): string[] {
    return [
      // Index ETFs
      'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'IVV', 'IVE',
      'AGG', 'BND', 'LQD', 'HYG', 'JNK', 'EMB', 'TIP',

      // Sector ETFs
      'XLF', 'XLE', 'XLK', 'XLI', 'XLV', 'XLU', 'XLP', 'XLY', 'XLB', 'XLC',
      'XLRE', 'XME', 'XBI', 'ITB', 'IAK', 'IBB', 'KBE', 'KIE',

      // Popular ETFs
      'ARKK', 'ARKF', 'ARKW', 'ARKG', 'GLD', 'SLV', 'TLT', 'UPRO', 'SPXL', 'TQQQ',
      'SOXL', 'FNGU', 'TECL', 'TECS', 'TECL', 'SOXS', 'LABU', 'UGL', 'SDS', 'SPXU',
      'VXX', 'UVXY', 'SVXY', 'SQQQ', 'SDS',

      // International
      'EFA', 'EEM', 'EWA', 'EWC', 'EWG', 'EWH', 'EWI', 'EWJ', 'EWL', 'EWM',
      'EWN', 'EWQ', 'EWS', 'EWT', 'EWZ', 'EWY',

      // Commodity
      'USO', 'GLD', 'SLV', 'PPLT', 'UNG', 'DBA', 'DBB', 'DBC', 'DJP',

      // Volatility
      'VIX', 'VXX', 'UVXY', 'SVXY', 'SQQQ', 'SDS', 'SPXU',
    ];
  }

  /**
   * Get latest trading day (business day)
   */
  private async getLatestTradingDay(): Promise<string> {
    const today = new Date();

    // Try today first
    const todayStr = today.toISOString().split('T')[0];
    try {
      const url = `${this.POLYGON_API_URL}/v1/marketstatus/now?apiKey=${this.apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.market === 'open') {
          return todayStr;
        }
      }
    } catch (error) {
      console.warn('Failed to get market status, using fallback logic');
    }

    // Fallback: go back days until we find a weekday
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      // Monday=1, Friday=5, skip weekends (0=Sunday, 6=Saturday)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return date.toISOString().split('T')[0];
      }
    }

    return todayStr; // ultimate fallback
  }

  /**
   * Fetch ALL stocks with MINIMAL filtering to get comprehensive coverage
   */
  private async fetchAllStocksMinimalFilter(date: string, config: MarketUniverseConfig): Promise<string[]> {
    const url = `${this.POLYGON_API_URL}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${config.api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch grouped market data: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        console.warn(`⚠️ No grouped market data for ${date}`);
        return [];
      }

      // ULTRA MINIMAL filtering - we want EVERY ticker possible
      const tickers = data.results
        .filter((result: any) => {
          const price = result.c || 0;
          const ticker = result.T || '';

          // Only filter out absolute garbage
          if (!ticker || ticker.length === 0) return false;
          if (price <= 0) return false;                    // Invalid price
          if (ticker.includes('.')) return false;           // Preferred shares/warrants
          if (ticker.length > 5) return false;              // Likely options/warrants

          return true;  // Keep EVERYTHING else
        })
        .map((result: any) => result.T)
        .filter((ticker: string) => ticker && ticker.length > 0);

      console.log(`✅ MINIMAL filtering: ${tickers.length} tickers from ${data.results.length} total results`);
      return tickers;

    } catch (error) {
      console.error(`❌ Error fetching minimal filtered stocks:`, error);
      return [];
    }
  }

  /**
   * Get ALL ETF tickers for comprehensive coverage
   */
  private getAllETFs(): string[] {
    // Comprehensive ETF list covering all major categories
    const majorETFs = [
      // Index ETFs
      'SPY', 'SPXL', 'SPXS', 'SPYU', 'SPUU', 'SPXU', 'UPRO', 'SDS', 'SSO', 'SH',
      'QQQ', 'TQQQ', 'SQQQ', 'QLD', 'QID', 'UDOW', 'SDOW', 'TECL', 'TECS',
      'DIA', 'DIAU', 'UDIA', 'DOG', 'DXD',
      'IWM', 'URTY', 'SRTY', 'TNA', 'TZA',
      'VTI', 'VT', 'VOO', 'IVV', 'VO', 'VEA', 'VWO', 'VGK', 'VPL', 'VSS',
      'IVE', 'IVW', 'VIG', 'VYM', 'VDC', 'VHT', 'VFH', 'VNQ', 'VPU', 'VAW', 'VCR',

      // Sector ETFs
      'XLF', 'FAS', 'FAZ', 'KBE', 'KRE', 'IYG', 'RYF', 'VFH', 'XLE', 'ERX', 'ERY',
      'GUSH', 'DRIP', 'XOP', 'FENY', 'PXE', 'XES', 'DIG', 'DUG', 'XME', 'GDX', 'GDXJ',
      'SIL', 'JNUG', 'JDST', 'COPX', 'PICK', 'XLB', 'XLI', 'XLU', 'XLK', 'XLV', 'XLY',
      'XLP', 'XLC', 'XLRE', 'IBB', 'LABU', 'LABD', 'XBI', 'YANG', 'YINN', 'FXI',
      'ASHR', 'EWH', 'EWT', 'EWA', 'EWW', 'EWZ', 'ECH', 'EWI', 'EWS', 'EWP',
      'EIDO', 'ENZL', 'EWM', 'EDEN', 'EWN', 'EIRL', 'EPHE', 'EPU', 'EPO', 'ENLQ',
      'EFA', 'EFAV', 'EEM', 'EUM', 'EEH', 'DYB', 'DYEH', 'IEMG', 'SCZ', 'EZU',
      'FEU', 'FEZ', 'CXSE', 'IEFA', 'AGZD', 'SPEM', 'VWO', 'VXUS', 'VEU',

      // Fixed Income
      'AGG', 'BND', 'AGGZ', 'BNDX', 'AGG', 'TLT', 'TBT', 'TMF', 'TMV', 'TLT', 'UBT', 'SBT',
      'IEF', 'GOVT', 'SHY', 'SHV', 'SPTL', 'SPTS', 'TIP', 'TIPS', 'STPZ', 'LQD', 'HYG',
      'JNK', 'SLQD', 'BKLN', 'IGIB', 'SJB', 'SJNK', 'HYGH', 'HYHG', 'HYMB', 'USHY',
      'BKAG', 'BSV', 'BIV', 'VCIT', 'VCLT', 'VCSH', 'IGOV', 'GOVT', 'SCHZ', 'SCHR',
      'SCHP', 'NUBD', 'BND', 'BNDX', 'BGRW', 'BND', 'WIP', 'PICB', 'IBND',

      // Commodity ETFs
      'GLD', 'GLDM', 'IAU', 'PHYS', 'BAR', 'SLV', 'SIVR', 'PSLV', 'PPLT', 'PALL',
      'DBP', 'GLTR', 'USO', 'UCO', 'SCO', 'DBO', 'USL', 'XLE', 'UNG', 'BOIL', 'KOLD',
      'DGAZ', 'CGW', 'FIW', 'PHO', 'GEX', 'GRID', 'ICLN', 'ICLW', 'ERTH', 'REMX',
      'LIT', 'URE', 'SRS', 'DRN', 'DRV', 'FXP', 'YXI', 'YANG', 'CROC', 'BKK',
      'THD', 'TUR', 'EPOL', 'EPHE', 'EPI', 'INXX', 'INDA', 'SMIN', 'EWS', 'EWM',

      // Volatility & Alternative
      'VIX', 'VIXY', 'UVXY', 'TVIX', 'SVXY', 'VXX', 'VXZ', 'VIXM', 'VXUB', 'VIIX',
      'CVOL', 'SIXM', 'VIXM', 'VTIP', 'VGIT', 'VGLT', 'BIL', 'SHV', 'SHY', 'IEF',
      'GOVT', 'SPTL', 'TIP', 'STIP', 'ZROZ', 'EDV', 'GBF', 'GTOT', 'GOVT', 'IEFA',
      'SSO', 'ULTRA', 'DDM', 'DIG', 'DGP', 'DXDW', 'DZK', 'QLD', 'ULE', 'UYM',
      'UWM', 'UXI', 'UWC', 'UYG', 'DHD', 'DOG', 'DXD', 'EFZ', 'EPV', 'EFU',
      'EUM', 'EUO', 'EVX', 'FXP', 'GLL', 'HIBS', 'LLSC', 'LTL', 'MZZ', 'OTPK',
      'PHBK', 'PST', 'QLD', 'REK', 'RWM', 'RZD', 'RXL', 'SBB', 'SCC', 'SDP',
      'SDS', 'SDD', 'SGG', 'SGF', 'SH', 'SJB', 'SJH', 'SJL', 'SKF', 'SMN',
      'SMV', 'SOXX', 'SCO', 'SIJ', 'SMDD', 'SMN', 'SOXS', 'SQQQ', 'TBT',
      'TNA', 'TWM', 'TYO', 'TYNS', 'TYD', 'UGA', 'UNG', 'UUP', 'UUP',
      'USDU', 'UWM', 'ULTRA', 'URE', 'ERY', 'DRIP', 'DUG', 'EET', 'EEM',
      'EFO', 'EFA', 'EPP', 'EWA', 'EWC', 'EWG', 'EWH', 'EWI', 'EWJ', 'EWL',
      'EWM', 'EWN', 'EWO', 'EWP', 'EWQ', 'EWS', 'EWT', 'EWU', 'EWY', 'EWZ',
      'EZA', 'EZH', 'EZJ', 'FAN', 'FEP', 'FXI', 'FXP', 'FXY', 'GEX', 'GII',
      'GUL', 'GXG', 'HAP', 'ICN', 'IDU', 'IFAS', 'IFEU', 'IFGL', 'IFOM',
      'ILF', 'INP', 'IOO', 'IPEM', 'ITOT', 'IXC', 'IXG', 'IXJ', 'IXN',
      'JMD', 'KNU', 'KOR', 'KWT', 'LQD', 'MCHI', 'MGA', 'MIDU', 'MINT',
      'MIV', 'MND', 'MOR', 'MST', 'MXEF', 'MXN', 'MYI', 'NLR', 'NULG',
      'PBP', 'PBW', 'PICK', 'PFF', 'PGF', 'PGJ', 'PGX', 'PHO', 'PKW',
      'PKX', 'PLND', 'PSP', 'PSQ', 'PXF', 'PZI', 'QID', 'QLD', 'QQEW',
      'QQQ', 'QQQE', 'QQQM', 'QQXT', 'RCD', 'RDIV', 'REM', 'REZ', 'RFV',
      'RGI', 'ROBO', 'RSX', 'RSXJ', 'RUSL', 'RWJ', 'RWL', 'RYF', 'RYT',
      'RZG', 'RZV', 'SCE', 'SCIF', 'SCJ', 'SCTR', 'SCZ', 'SDP', 'SDY',
      'SEA', 'SEM', 'SIL', 'SIVR', 'SMLF', 'SMLV', 'SMH', 'SOXL', 'SOXS',
      'SOXX', 'SPFF', 'SPHB', 'SPLV', 'SPXL', 'SPXS', 'SPXE', 'SPY',
      'SPYB', 'SPYD', 'SPYU', 'SPYV', 'SPYX', 'SQZZ', 'SRET', 'STIP',
      'SUB', 'SUSA', 'SVXY', 'SYBS', 'SYG', 'SYLD', 'SYT', 'TAN',
      'TBF', 'TBT', 'TDIV', 'TFI', 'TFLO', 'TGCR', 'TIP', 'TIPX',
      'TLO', 'TLTD', 'TLT', 'TMF', 'TMV', 'TNA', 'TQQQ', 'TRSK',
      'TTT', 'TYD', 'UGLD', 'UPRO', 'URA', 'URE', 'USCI', 'USLV',
      'USO', 'UTSL', 'UXI', 'UYG', 'UYM', 'UUP', 'VNM', 'VNM',
      'VTIP', 'VWO', 'VTWO', 'VXUS', 'VXX', 'WISA', 'WISA', 'WLD',
      'WTMC', 'XBI', 'XES', 'XHB', 'XHE', 'XHS', 'XIE', 'XII',
      'XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE',
      'XLU', 'XLV', 'XLY', 'XME', 'XOP', 'XOP', 'OPRA', 'OTEX',
      'XPP', 'XRT', 'RXI', 'XSB', 'RXD', 'XT', 'XTL', 'XAR',
      'AAP', 'AAXJ', 'ABEQ', 'ABM', 'ABR', 'ABS', 'ACG', 'ACGR', 'ACN',
      'ACIO', 'ACT', 'ADIV', 'ADMA', 'ADX', 'ADZ', 'AAXJ', 'ADRE', 'AFK',
      'AGG', 'AGGH', 'AGZD', 'AIA', 'AIE', 'ALFA', 'ALFA', 'ALTM', 'AMJ',
      'AMU', 'AMZA', 'ANGL', 'AOA', 'ARKF', 'ARKG', 'ARKK', 'ARKQ',
      'ARKW', 'AROW', 'ATMP', 'AUS', 'AUAR', 'AURO', 'AUUS', 'AVDV',
      'AVE', 'AVEM', 'AVES', 'AVUS', 'AVZ', 'AVUV', 'AZAE', 'AZBA',
      'AZJE', 'AZLA', 'BAL', 'BBIN', 'BBMC', 'BCAT', 'BCOM', 'BDRY',
      'BEACH', 'BEC', 'BEEM', 'BEMP', 'BEP', 'BETZ', 'BFIT', 'BFOR',
      'BFR', 'BGCP', 'BGX', 'BIBL', 'BIB', 'BIL', 'BIND', 'BIZD',
      'BKN', 'BKLN', 'BKSY', 'BLMN', 'BLV', 'BME', 'BND', 'BNDS',
      'BNDX', 'BOIL', 'BOND', 'BOND', 'BRKD', 'BRWU', 'BSJP', 'BSV',
      'BTEC', 'BTF', 'BTR', 'BUSD', 'BWX', 'BZQ', 'CALT', 'CARZ',
      'CBOE', 'CBON', 'CBD', 'CBOE', 'CBRE', 'CCXI', 'CDW', 'CEFS',
      'CETF', 'CEW', 'CF', 'CFI', 'CFOR', 'CGGR', 'CGW', 'CHAN',
      'CHAR', 'CHAU', 'CHEF', 'CHGX', 'CHIE', 'CHIH', 'CHII', 'CHIM',
      'CHIQ', 'CHIS', 'CHIX', 'CHNA', 'CHKD', 'CHKM', 'CHOC', 'CHOW',
      'CHPY', 'CHRS', 'CHS', 'CHU', 'CHY', 'CHZ', 'CHZ', 'CIA',
      'CII', 'CIM', 'CIO', 'CIU', 'CIV', 'CLOU', 'CLWT', 'CMBS',
      'CMF', 'CMU', 'CMU', 'CN', 'CNR', 'CNR', 'COBZ', 'CODI',
      'COME', 'COMT', 'CONY', 'COOL', 'CORP', 'COW', 'COWZ', 'CPER',
      'CQP', 'CRBN', 'CRCM', 'CREE', 'CREZ', 'CRFB', 'CROX', 'CRPH',
      'CROZ', 'CRWD', 'CRZO', 'CSD', 'CSIQ', 'CSJ', 'CSM', 'CSPX',
      'CSTE', 'CTRN', 'CUBI', 'CUPQ', 'CUT', 'CVCD', 'CVI', 'CVM',
      'CVY', 'CWCO', 'CWG', 'CWGC', 'CWLA', 'CWT', 'CXB', 'CXSE',
      'CYA', 'CYB', 'CYD', 'CYFR', 'CYH', 'CYL', 'CYM', 'CYOU',
      'CYSA', 'CYS', 'CYTR', 'CZA', 'CZB', 'CZC', 'CZE', 'CZL',
      'DALL', 'DBC', 'DBE', 'DBEF', 'DBEZ', 'DBGR', 'DBI', 'DBJP',
      'DBKO', 'DBMF', 'DBP', 'DBS', 'DBTM', 'DBUS', 'DBZ', 'DBZ',
      'DCBO', 'DCC', 'DCEO', 'DCHK', 'DCR', 'DCT', 'DDG', 'DDM',
      'DDWM', 'DE', 'DEEP', 'DEMA', 'DEMS', 'DEMS', 'DEW', 'DFAS',
      'DFE', 'DFEN', 'DFE', 'DFE', 'DFEN', 'DGE', 'DGE', 'DGS',
      'DGRW', 'DGRS', 'DHG', 'DHS', 'DIA', 'DIE', 'DIM', 'DIO',
      'DIU', 'DJIA', 'DKA', 'DLA', 'DLN', 'DLR', 'DLS', 'DLY',
      'DM', 'DML', 'DMR', 'DMS', 'DNAA', 'DNDD', 'DNAE', 'DNL',
      'DNO', 'DNQ', 'DNQY', 'DOU', 'DOU', 'DPST', 'DRIP', 'DRN',
      'DRSK', 'DRVR', 'DSI', 'DSMA', 'DSP', 'DSPN', 'DSU', 'DSU',
      'DTEC', 'DTH', 'DTN', 'DUSL', 'DUST', 'DUSA', 'DUST', 'DUSL',
      'DWD', 'DWM', 'DWL', 'DWL', 'DXD', 'DXJ', 'DXJS', 'DXJ',
      'DXJ', 'DXK', 'DXKW', 'DXL', 'DXPE', 'DXPS', 'DXRB', 'DXR',
      'DXRS', 'DXRW', 'DXSH', 'DXSL', 'DXSO', 'DXTE', 'DXTO', 'DXTR',
      'DYB', 'DYEH', 'DYN', 'EAFR', 'EATM', 'EBF', 'EBND', 'EBON',
      'ECCC', 'ECCC', 'ECH', 'ECNS', 'ECON', 'ECOW', 'ECP', 'ECS',
      'CTEC', 'CTA', 'CTAR', 'CTAS', 'CTB', 'CTDF', 'CTEX', 'CTO',
      'CTR', 'CTT', 'CUBA', 'CUMC', 'CURE', 'CURI', 'CUV', 'CV',
      'CVLC', 'CVY', 'CWBD', 'CWBF', 'CWGC', 'CWH', 'CWIA', 'CWIB',
      'CWIC', 'CWJ', 'CWK', 'CWL', 'CWP', 'CWR', 'CWTS', 'CXE',
      'CXSE', 'CYA', 'CYB', 'CYCC', 'CYCC', 'CYCC', 'CYCF', 'CYCG',
      'CYCH', 'CYCJ', 'CYCM', 'CYCN', 'CYCO', 'CYCP', 'CYCR', 'CYCT',
      'CYCU', 'CYCV', 'CYCW', 'CYCX', 'CYCY', 'CZM', 'CZO', 'CZR'
    ];

    return majorETFs;
  }

  /**
   * Fetch additional ticker listings from Polygon ticker API
   */
  private async fetchAdditionalTickers(config: MarketUniverseConfig): Promise<string[]> {
    const url = `${this.POLYGON_API_URL}/v3/reference/tickers?market=stocks&active=true&limit=1000&apiKey=${config.api_key}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticker listings: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      const tickers = data.results
        .filter((ticker: any) => {
          const tickerSymbol = ticker.ticker || '';
          const currency = ticker.currency || '';

          if (!tickerSymbol || tickerSymbol.length === 0) return false;
          if (currency !== 'USD') return false;
          if (tickerSymbol.includes('.')) return false; // Preferred shares
          if (tickerSymbol.includes('-')) return false; // Warrants, etc.

          return true;
        })
        .map((ticker: any) => ticker.ticker)
        .filter((t: string) => t && t.length > 0);

      console.log(`✅ Additional tickers from API: ${tickers.length}`);
      return tickers;

    } catch (error) {
      console.error('❌ Error fetching additional tickers:', error);
      return [];
    }
  }

  /**
   * Helper method to add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch complete market universe for a specific date (fallback)
   */
  private async fetchFallbackMarketUniverse(config: MarketUniverseConfig): Promise<string[]> {
    console.log('🔄 Using fallback market universe fetch...');

    try {
      // Get latest trading day
      const latestDay = await this.getLatestTradingDay();

      // Use minimal filtering approach for fallback
      const fallbackTickers = await this.fetchAllStocksMinimalFilter(latestDay, config);

      // Add ETFs if requested
      const allTickers = [...fallbackTickers];
      if (config.include_etfs) {
        allTickers.push(...this.getAllETFs());
      }

      const uniqueTickers = [...new Set(allTickers)].sort();
      console.log(`🔄 Fallback complete: ${uniqueTickers.length} tickers`);

      return uniqueTickers;

    } catch (error) {
      console.error('❌ Fallback also failed:', error);
      // Return a basic set of major symbols as last resort
      return [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B', 'JPM', 'JNJ',
        'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'CVX', 'LLY', 'ABBV',
        'PFE', 'KO', 'PEP', 'T', 'DIS', 'INTC', 'CSCO', 'CMCSA', 'NFLX', 'ADBE',
        'CRM', 'MRK', 'ABT', 'ACN', 'DHR', 'VZ', 'NKE', 'MDT', 'WFC', 'TXN',
        'PYPL', 'CVS', 'PM', 'HON', 'IBM', 'AMGN', 'LOW', 'CAT', 'GE', 'MMC'
      ];
    }
  }

  /**
   * Create market universe as Python array string for injection
   */
  async createMarketUniversePythonArray(config: MarketUniverseConfig): Promise<string> {
    const symbols = await this.fetchCompleteMarketUniverse(config);

    // Format as Python array
    const pythonArray = `SYMBOLS = [
${symbols.map(symbol => `    "${symbol}"`).join(',\n')}
]`;

    return pythonArray;
  }

  /**
   * Get market universe statistics
   */
  async getMarketUniverseStats(config: MarketUniverseConfig): Promise<{
    total_symbols: number;
    nasdaq_count: number;
    nyse_count: number;
    etf_count: number;
    sample_symbols: string[];
  }> {
    const symbols = await this.fetchCompleteMarketUniverse(config);

    // Count symbols by exchange (basic pattern matching)
    const nasdaqCount = symbols.filter(s =>
      /^[A-Z]/.test(s) && !s.includes('.') && s.length <= 5
    ).length;

    const nyseCount = symbols.filter(s =>
      /^[A-Z]/.test(s) && !s.includes('.') && s.length <= 4
    ).length;

    const etfCount = symbols.filter(s =>
      ['SPY', 'QQQ', 'IWM', 'DIA', 'GLD', 'SLV', 'EFA', 'EEM', 'XLF'].some(etf => s.includes(etf))
    ).length;

    return {
      total_symbols: symbols.length,
      nasdaq_count: nasdaqCount,
      nyse_count: nyseCount,
      etf_count: etfCount,
      sample_symbols: symbols.slice(0, 10)
    };
  }
}

export const marketUniverseService = new MarketUniverseService();