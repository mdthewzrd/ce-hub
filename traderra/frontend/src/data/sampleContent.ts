export interface SampleFolder {
  id: string
  name: string
  parentId?: string
  icon: string
  color: string
  description?: string
  position: number
}

export interface SampleDocument {
  id: string
  title: string
  folderId: string
  type: 'trade_entry' | 'strategy' | 'research' | 'review' | 'template' | 'note'
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const SAMPLE_FOLDERS: SampleFolder[] = [
  // Root level folders
  {
    id: 'trading-journal',
    name: 'Trading Journal',
    icon: 'briefcase',
    color: '#60a5fa',
    description: 'Main trading activities and trade entries',
    position: 1
  },
  {
    id: 'strategies',
    name: 'Trading Strategies',
    icon: 'trending-up',
    color: '#34d399',
    description: 'Documented trading strategies and methodologies',
    position: 2
  },
  {
    id: 'research',
    name: 'Market Research',
    icon: 'book-open',
    color: '#a78bfa',
    description: 'Market analysis, stock research, and economic data',
    position: 3
  },
  {
    id: 'reviews',
    name: 'Performance Reviews',
    icon: 'target',
    color: '#fb923c',
    description: 'Monthly/quarterly performance analysis and goals',
    position: 4
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: 'file-text',
    color: '#f472b6',
    description: 'Reusable templates for consistent documentation',
    position: 5
  },

  // Trading Journal subfolders
  {
    id: 'trades-2024',
    name: '2024 Trades',
    parentId: 'trading-journal',
    icon: 'folder',
    color: '#60a5fa',
    description: 'All trades from 2024',
    position: 1
  },
  {
    id: 'trades-january',
    name: 'January',
    parentId: 'trades-2024',
    icon: 'folder',
    color: '#60a5fa',
    position: 1
  },
  {
    id: 'trades-february',
    name: 'February',
    parentId: 'trades-2024',
    icon: 'folder',
    color: '#60a5fa',
    position: 2
  },
  {
    id: 'trades-march',
    name: 'March',
    parentId: 'trades-2024',
    icon: 'folder',
    color: '#60a5fa',
    position: 3
  },
  {
    id: 'archives',
    name: 'Archives',
    parentId: 'trading-journal',
    icon: 'archive',
    color: '#9ca3af',
    description: 'Older trades and historical data',
    position: 2
  },

  // Research subfolders
  {
    id: 'sectors',
    name: 'Sector Analysis',
    parentId: 'research',
    icon: 'folder',
    color: '#a78bfa',
    description: 'Industry and sector research',
    position: 1
  },
  {
    id: 'companies',
    name: 'Company Research',
    parentId: 'research',
    icon: 'folder',
    color: '#a78bfa',
    description: 'Individual company analysis',
    position: 2
  },
  {
    id: 'economic-data',
    name: 'Economic Data',
    parentId: 'research',
    icon: 'folder',
    color: '#a78bfa',
    description: 'Macroeconomic indicators and analysis',
    position: 3
  }
]

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  // Trade entries
  {
    id: 'yibo-momentum-trade',
    title: 'YIBO Momentum Breakout Trade',
    folderId: 'trades-january',
    type: 'trade_entry',
    content: `# YIBO Momentum Breakout Trade

## Entry Details
- **Date**: January 15, 2024
- **Symbol**: YIBO
- **Entry Price**: $12.45
- **Position Size**: 500 shares
- **Total Investment**: $6,225

## Analysis
Strong momentum play based on:
- Breakout above $12.00 resistance
- Volume spike (3x average)
- Biotech sector strength
- FDA approval catalyst expected

## Risk Management
- **Stop Loss**: $11.80 (-5.2%)
- **Target 1**: $14.50 (+16.5%)
- **Target 2**: $16.80 (+35%)
- **Risk/Reward**: 1:3.2

## Trade Notes
Morning gap up on positive news. Clean breakout with strong volume. Entered on the first pullback to support.

## Exit Strategy
- Partial profit at Target 1 (50% position)
- Trail stop for remaining position
- Watch for momentum exhaustion signals

## Result
**Status**: Closed ✅
**Exit Price**: $15.20
**Profit**: $1,375 (+22.1%)
**Hold Time**: 8 days

## Lessons Learned
- Momentum plays work best with volume confirmation
- Taking partial profits preserved gains when stock pulled back
- Biotech volatility requires tighter risk management`,
    tags: ['momentum', 'biotech', 'breakout', 'short-term'],
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-23T16:45:00Z'
  },

  {
    id: 'lpo-swing-trade',
    title: 'LPO Support Bounce Strategy',
    folderId: 'trades-january',
    type: 'trade_entry',
    content: `# LPO Support Bounce Strategy

## Entry Details
- **Date**: January 22, 2024
- **Symbol**: LPO
- **Entry Price**: $28.30
- **Position Size**: 200 shares
- **Total Investment**: $5,660

## Setup Analysis
Support level bounce play:
- Testing $28.00 support (3rd time)
- RSI oversold (32)
- Bullish divergence on MACD
- Previous resistance now support

## Technical Levels
- **Support**: $28.00
- **Resistance 1**: $31.50
- **Resistance 2**: $34.00
- **Stop Loss**: $27.60 (-2.5%)

## Fundamental Backdrop
- Strong earnings last quarter
- Institutional buying interest
- Sector rotation into value plays
- Dividend yield attractive at 3.2%

## Position Management
Planning to hold for 2-4 weeks targeting $32-34 range.

## Updates
**Day 3**: Holding above $28.50, looking for breakout above $30
**Day 7**: Breaking through $31, raising stop to $29.50

## Result
**Status**: Open 🟡
**Current Price**: $31.75
**Unrealized P&L**: +$690 (+12.2%)`,
    tags: ['swing-trade', 'support-bounce', 'value', 'medium-term'],
    createdAt: '2024-01-22T14:20:00Z',
    updatedAt: '2024-01-29T11:30:00Z'
  },

  // Strategy documents
  {
    id: 'momentum-strategy',
    title: 'Momentum Breakout Strategy',
    folderId: 'strategies',
    type: 'strategy',
    content: `# Momentum Breakout Strategy

## Overview
A systematic approach to trading momentum breakouts in high-volume situations with strong catalysts.

## Entry Criteria
1. **Price Action**
   - Clear breakout above significant resistance
   - Volume at least 2x 20-day average
   - Minimum 3% move from resistance level

2. **Market Conditions**
   - Strong overall market trend
   - Sector showing relative strength
   - No major market events pending

3. **Fundamental Catalyst**
   - Earnings beat
   - FDA approval
   - Partnership announcement
   - Analyst upgrade

## Risk Management
- **Position Size**: Maximum 2% of portfolio per trade
- **Stop Loss**: 5-8% below entry
- **Time Stop**: Exit if no progress in 10 trading days

## Profit Taking
- **First Target**: 15-20% gain (sell 50%)
- **Second Target**: 30-40% gain (sell 25%)
- **Runner**: Trail stop for final 25%

## Market Conditions
**Best Markets**: Strong uptrend, low VIX (<20)
**Avoid**: High volatility periods, bearish market

## Backtesting Results
- **Win Rate**: 65%
- **Average Win**: +18.5%
- **Average Loss**: -6.2%
- **Risk/Reward**: 1:3.0
- **Profit Factor**: 2.8

## Recent Performance
- **Last 10 trades**: 7 wins, 3 losses
- **Total P&L**: +$12,450
- **Best Trade**: YIBO (+22.1%)
- **Worst Trade**: BIOQ (-7.8%)

## Rules Refinements
1. Added volume filter after poor results in low-volume breakouts
2. Reduced position size in biotech (higher volatility)
3. Tightened stops during earnings season`,
    tags: ['momentum', 'breakout', 'systematic', 'high-probability'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-30T15:45:00Z'
  },

  {
    id: 'support-resistance-rules',
    title: 'Support & Resistance Trading Rules',
    folderId: 'strategies',
    type: 'strategy',
    content: `# Support & Resistance Trading Rules

## Core Principles
Support and resistance levels represent areas where buying and selling pressure balance out, creating reliable trading opportunities.

## Identifying Key Levels
1. **Horizontal Levels**
   - Previous swing highs/lows
   - Round numbers ($50, $100, etc.)
   - Previous breakout points
   - Volume-weighted levels

2. **Dynamic Levels**
   - 20, 50, 200-day moving averages
   - Trend lines
   - Fibonacci retracements
   - Bollinger Band boundaries

## Trading Rules

### Support Bounces
- **Entry**: Near support with rejection candle
- **Stop**: 2-3% below support level
- **Target**: Previous resistance or 2:1 R/R

### Resistance Breakouts
- **Entry**: 1-2% above resistance on volume
- **Stop**: Back below resistance level
- **Target**: Next resistance or measured move

### Failed Breaks
- **Short Setup**: When price fails to hold breakout
- **Entry**: Below breakdown level
- **Stop**: Back above resistance
- **Target**: Next support level

## Confirmation Signals
- Volume increase on breakout/breakdown
- RSI divergence at levels
- Multiple timeframe alignment
- Candlestick patterns (hammer, doji, engulfing)

## Examples from Recent Trades
1. **LPO Support Bounce**: $28.00 level held 3 times
2. **NVDA Resistance Break**: $480 level broken on earnings
3. **TSLA Failed Break**: $250 resistance rejection

## Common Mistakes to Avoid
- Trading every level (wait for best setups)
- Ignoring volume confirmation
- Not respecting stops when wrong
- Over-leveraging near key levels`,
    tags: ['support-resistance', 'technical-analysis', 'systematic'],
    createdAt: '2024-01-08T09:15:00Z',
    updatedAt: '2024-01-25T14:20:00Z'
  },

  // Research documents
  {
    id: 'biotech-analysis',
    title: 'Biotech Sector Q1 2024 Analysis',
    folderId: 'sectors',
    type: 'research',
    content: `# Biotech Sector Analysis - Q1 2024

## Sector Overview
The biotech sector (XBI) has shown resilience in Q1 despite broader market volatility, driven by several FDA approvals and strong pipeline developments.

## Key Trends
1. **FDA Approvals Accelerating**
   - 12 new drug approvals in Q1 vs 8 in Q1 2023
   - Faster review times for breakthrough therapies
   - Increased priority for rare disease treatments

2. **Funding Environment Improving**
   - Biotech IPOs up 40% QoQ
   - Venture funding returning to sector
   - Strategic partnerships increasing

3. **AI/ML Integration**
   - Drug discovery acceleration
   - Clinical trial optimization
   - Regulatory submission improvements

## Top Holdings Analysis

### GILD (Gilead Sciences)
- **Price**: $78.50
- **Market Cap**: $98B
- **Catalyst**: New HIV drug launch
- **Risk**: Patent cliff concerns

### BIIB (Biogen)
- **Price**: $245.20
- **Market Cap**: $35B
- **Catalyst**: Alzheimer's drug approval
- **Risk**: Competitive landscape

### REGN (Regeneron)
- **Price**: $890.30
- **Market Cap**: $96B
- **Catalyst**: Obesity drug pipeline
- **Risk**: High valuation

## Upcoming Catalysts
- **March 15**: ADMA FDA decision
- **April 2**: BMRN earnings
- **April 20**: SAGE Phase 3 data
- **May 5**: ALNY investor day

## Sector Risks
1. Regulatory changes
2. Drug pricing pressure
3. Clinical trial failures
4. Market sentiment shifts

## Investment Thesis
Cautiously optimistic on sector with focus on:
- Large-cap stable names (GILD, BIIB)
- Specific catalyst plays (small-cap with near-term approvals)
- Diversified exposure through XBI ETF

## Position Sizing Recommendations
- Maximum 15% portfolio allocation
- Individual positions capped at 3%
- Higher cash allocation for volatility`,
    tags: ['biotech', 'sector-analysis', 'FDA', 'pharmaceuticals'],
    createdAt: '2024-01-28T11:00:00Z',
    updatedAt: '2024-01-30T16:30:00Z'
  },

  // Review documents
  {
    id: 'january-review',
    title: 'January 2024 Trading Review',
    folderId: 'reviews',
    type: 'review',
    content: `# January 2024 Trading Review

## Performance Summary
- **Total P&L**: +$8,450 (+4.2% portfolio)
- **Win Rate**: 70% (7 wins, 3 losses)
- **Best Trade**: YIBO (+$1,375)
- **Worst Trade**: SOFI (-$650)
- **Average Hold Time**: 6.5 days

## Trades Executed
| Symbol | Entry | Exit | P&L | Hold Days | Strategy |
|--------|--------|------|-----|-----------|----------|
| YIBO | $12.45 | $15.20 | +$1,375 | 8 | Momentum |
| LPO | $28.30 | Open | +$690 | 9 | Support Bounce |
| NVDA | $485.20 | $510.50 | +$2,530 | 3 | Earnings Play |
| SOFI | $7.80 | $7.15 | -$650 | 5 | Failed Breakout |
| AAPL | $190.50 | $195.80 | +$1,060 | 4 | Swing Trade |

## Strategy Performance
1. **Momentum Breakouts**: 3/4 wins (+$3,255)
2. **Support/Resistance**: 2/3 wins (+$1,750)
3. **Earnings Plays**: 1/1 win (+$2,530)
4. **Failed Trades**: 3 losses (-$1,485)

## What Worked Well
- Strong momentum plays with volume confirmation
- Taking partial profits preserved gains
- Quick exits on failed setups
- Sector rotation timing (tech earnings)

## Areas for Improvement
1. **Position Sizing**: Was too aggressive on SOFI trade
2. **Risk Management**: Held losers too long (SOFI, PLTR)
3. **Market Timing**: Entered defensive during strong market

## Key Lessons
- Volume is critical for momentum plays
- Don't fight strong market trends
- Biotech requires smaller position sizes
- Earnings season offers great opportunities

## February Goals
1. Increase win rate to 75%
2. Improve average R/R to 1:2.5
3. Focus on highest probability setups only
4. Better position sizing discipline

## Portfolio Adjustments
- Reduce biotech exposure from 20% to 15%
- Increase tech allocation for earnings season
- Build larger cash position for opportunities
- Add defensive positions if market shows weakness

## Market Outlook
Bullish bias for February with focus on:
- Earnings momentum in tech
- Fed policy clarity
- Sector rotation opportunities
- Individual stock catalysts`,
    tags: ['performance-review', 'monthly', 'analysis', 'goals'],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T17:30:00Z'
  },

  // Template documents
  {
    id: 'trade-analysis-template',
    title: 'Trade Analysis Template',
    folderId: 'templates',
    type: 'template',
    content: `# Trade Analysis Template

## Basic Information
- **Date**: [Entry Date]
- **Symbol**: [Ticker]
- **Entry Price**: $[Price]
- **Position Size**: [Shares/Contracts]
- **Total Investment**: $[Amount]

## Setup Analysis
**Strategy**: [Momentum/Swing/Scalp/etc.]

**Technical Setup**:
- Chart pattern: [Breakout/Bounce/Reversal]
- Key levels: Support $[X], Resistance $[Y]
- Indicators: [RSI, MACD, Volume, etc.]
- Timeframe: [Daily/Hourly/etc.]

**Fundamental Catalyst** (if applicable):
- [Earnings/News/FDA approval/etc.]

## Risk Management
- **Stop Loss**: $[Price] ([%] loss)
- **Target 1**: $[Price] ([%] gain)
- **Target 2**: $[Price] ([%] gain)
- **Risk/Reward Ratio**: 1:[X]
- **Position Size Justification**: [% of portfolio, volatility considerations]

## Trade Thesis
[Detailed explanation of why this trade makes sense]

## Market Context
- **Overall Market**: [Bullish/Bearish/Neutral]
- **Sector Strength**: [Strong/Weak/Neutral]
- **VIX Level**: [Low/Medium/High volatility]
- **Economic Environment**: [Any relevant macro factors]

## Trade Management Plan
- **Partial Profit Strategy**: [When and how much to take off]
- **Stop Adjustment Rules**: [When to move stops]
- **Time Stops**: [Maximum hold time]
- **News/Event Risks**: [Earnings, Fed meetings, etc.]

## Daily Updates
**Day 1**: [Price action, volume, any news]
**Day 2**: [Progress toward targets, any adjustments]
[Continue as needed...]

## Final Results
- **Exit Date**: [Date]
- **Exit Price**: $[Price]
- **Total P&L**: $[Amount] ([%])
- **Hold Time**: [X] days
- **Actual vs Expected**: [How did it compare to plan]

## Lessons Learned
**What Went Right**:
- [List successful aspects]

**What Could Be Improved**:
- [Areas for improvement]

**Key Takeaways**:
- [Main lessons for future trades]

## Strategy Refinements
[Any adjustments to make to strategy based on this trade]`,
    tags: ['template', 'trade-analysis', 'systematic'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z'
  },

  {
    id: 'monthly-review-template',
    title: 'Monthly Review Template',
    folderId: 'templates',
    type: 'template',
    content: `# [Month Year] Trading Review

## Performance Summary
- **Total P&L**: $[Amount] ([%] of portfolio)
- **Number of Trades**: [X]
- **Win Rate**: [%] ([X] wins, [Y] losses)
- **Average Win**: +$[Amount] (+[%])
- **Average Loss**: -$[Amount] (-[%])
- **Best Trade**: [Symbol] (+$[Amount])
- **Worst Trade**: [Symbol] (-$[Amount])
- **Average Hold Time**: [X] days
- **Sharpe Ratio**: [X.XX]

## Trade Breakdown
| Symbol | Entry Date | Exit Date | Entry Price | Exit Price | P&L | % Gain/Loss | Strategy | Hold Days |
|--------|------------|-----------|-------------|------------|-----|-------------|----------|-----------|
| [SYMBOL] | [Date] | [Date] | $[Price] | $[Price] | $[Amount] | [%] | [Strategy] | [Days] |

## Strategy Performance Analysis
1. **[Strategy Name]**: [X/Y] wins, $[P&L], [%] win rate
2. **[Strategy Name]**: [X/Y] wins, $[P&L], [%] win rate
3. **[Strategy Name]**: [X/Y] wins, $[P&L], [%] win rate

## Market Environment
- **Market Direction**: [Bull/Bear/Sideways]
- **Average VIX**: [Level]
- **Sector Leaders**: [List top performing sectors]
- **Major Events**: [Fed meetings, earnings seasons, etc.]

## What Worked Well
1. [Success factor 1]
2. [Success factor 2]
3. [Success factor 3]

## Areas for Improvement
1. **[Area 1]**: [Specific issue and impact]
2. **[Area 2]**: [Specific issue and impact]
3. **[Area 3]**: [Specific issue and impact]

## Key Lessons Learned
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]

## Risk Management Review
- **Largest Loss**: [%] of portfolio
- **Maximum Drawdown**: [%]
- **Position Sizing**: [Average % per trade]
- **Stop Loss Effectiveness**: [% of stops hit vs manual exits]

## Portfolio Allocation Review
- **Cash**: [%]
- **Equities**: [%]
- **Options**: [%]
- **Sector Breakdown**: [List major sectors and %]

## Goals for Next Month
1. **Performance Goal**: [Specific target]
2. **Process Goal**: [Specific improvement]
3. **Risk Goal**: [Specific risk metric]
4. **Learning Goal**: [Skill to develop]

## Strategy Adjustments
- [Adjustment 1 and reasoning]
- [Adjustment 2 and reasoning]
- [Adjustment 3 and reasoning]

## Market Outlook for [Next Month]
**Overall Bias**: [Bullish/Bearish/Neutral]

**Key Events to Watch**:
- [Event 1 and date]
- [Event 2 and date]
- [Event 3 and date]

**Preferred Strategies**:
- [Strategy 1 and reasoning]
- [Strategy 2 and reasoning]

**Sectors to Focus On**:
- [Sector 1]: [Reasoning]
- [Sector 2]: [Reasoning]

## Action Items
- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]`,
    tags: ['template', 'monthly-review', 'performance', 'analysis'],
    createdAt: '2024-01-05T10:30:00Z',
    updatedAt: '2024-01-15T16:45:00Z'
  }
]

// Helper function to get documents by folder
export function getDocumentsByFolder(folderId: string): SampleDocument[] {
  return SAMPLE_DOCUMENTS.filter(doc => doc.folderId === folderId)
}

// Helper function to get folder hierarchy
export function getFolderHierarchy(): SampleFolder[] {
  const folderMap = new Map<string, SampleFolder & { children: SampleFolder[] }>()

  // Create map with children arrays
  SAMPLE_FOLDERS.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build hierarchy
  const rootFolders: SampleFolder[] = []
  SAMPLE_FOLDERS.forEach(folder => {
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children.push(folder)
      }
    } else {
      rootFolders.push(folder)
    }
  })

  return rootFolders
}

// Helper function to get folder path
export function getFolderPath(folderId: string): string {
  const folder = SAMPLE_FOLDERS.find(f => f.id === folderId)
  if (!folder) return ''

  if (!folder.parentId) return folder.name

  const parentPath = getFolderPath(folder.parentId)
  return `${parentPath} / ${folder.name}`
}