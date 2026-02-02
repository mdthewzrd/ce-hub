"""
Backside B Scanner - Messy Version for AI Testing
This is a DELIBERATELY poorly formatted version to test Renata AI's ability
to understand code structure and apply proper formatting.
"""
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp

class BacksideBMessy:
    def __init__(self):
        self.session=requests.Session()
        self.api_key="Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url="https://api.polygon.io"
        self.max_workers=mp.cpu_count() or 16
#Messy parameter dict - no quotes, bad spacing
        self.backside_params={
price_min:8.0,
adv20_min_usd:30_000_000,
abs_lookback_days:1000,
abs_exclude_days:10,
pos_abs_max:0.75,
trigger_mode:"D1_or_D2",
atr_mult:0.9,
vol_mult:0.9,
d1_vol_mult_min:None,
d1_volume_min:15_000_000,
slope5d_min:3.0,
high_ema9_mult:1.05,
gap_div_atr_min:0.75,
open_over_ema9_min:0.9,
d1_green_atr_min:0.30,
require_open_gt_prev_high:True,
enforce_d1_above_d2:True,
}
    self.scan_start="2022-01-01"
    self.scan_end="2025-12-31"
    def fetch_data(self,ticker,start,end):
        url=f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
        r=self.session.get(url,params={"apiKey":self.api_key,"adjusted":"true","sort":"asc","limit":50000})
        r.raise_for_status()
        rows=r.json().get("results",[])
        if not rows:
            return pd.DataFrame()
        return (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"],unit="ms",utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())
    def add_metrics(self,df):
        if df.empty:
            return df
        m=df.copy()
        try:
            m.index=m.index.tz_localize(None)
        except Exception:
            pass
        m["EMA_9"]=m["Close"].ewm(span=9,adjust=False).mean()
        m["EMA_20"]=m["Close"].ewm(span=20,adjust=False).mean()
        hi_lo=m["High"]-m["Low"]
        hi_prev=(m["High"]-m["Close"].shift(1)).abs()
        lo_prev=(m["Low"]-m["Close"].shift(1)).abs()
        m["TR"]=pd.concat([hi_lo,hi_prev,lo_prev],axis=1).max(axis=1)
        m["ATR_raw"]=m["TR"].rolling(14,min_periods=14).mean()
        m["ATR"]=m["ATR_raw"].shift(1)
        m["VOL_AVG"]=m["Volume"].rolling(14,min_periods=14).mean().shift(1)
        m["Prev_Volume"]=m["Volume"].shift(1)
        m["ADV20_$"]=(m["Close"]*m["Volume"]).rolling(20,min_periods=20).mean().shift(1)
        m["Slope_9_5d"]=(m["EMA_9"]-m["EMA_9"].shift(5))/m["EMA_9"].shift(5)*100
        m["High_over_EMA9_div_ATR"]=(m["High"]-m["EMA_9"])/m["ATR"]
        m["Gap_abs"]=(m["Open"]-m["Close"].shift(1)).abs()
        m["Gap_over_ATR"]=m["Gap_abs"]/m["ATR"]
        m["Open_over_EMA9"]=m["Open"]/m["EMA_9"]
        m["Body_over_ATR"]=(m["Close"]-m["Open"])/m["ATR"]
        m["Prev_Close"]=m["Close"].shift(1)
        m["Prev_Open"]=m["Open"].shift(1)
        m["Prev_High"]=m["High"].shift(1)
        return m
    def abs_top_window(self,df,d0,lookback_days,exclude_days):
        if df.empty:
            return (np.nan,np.nan)
        cutoff=d0-pd.Timedelta(days=exclude_days)
        wstart=cutoff-pd.Timedelta(days=lookback_days)
        win=df[(df.index>wstart)&(df.index<=cutoff)]
        if win.empty:
            return (np.nan,np.nan)
        return float(win["Low"].min()),float(win["High"].max())
    def pos_between(self,val,lo,hi):
        if any(pd.isna(t) for t in (val,lo,hi)) or hi<=lo:
            return np.nan
        return max(0.0,min(1.0,float((val-lo)/(hi-lo))))
    def _check_trigger(self,rx):
        if pd.isna(rx.get("Prev_Close"))or pd.isna(rx.get("ADV20_$")):
            return False
        if rx["Prev_Close"]<self.backside_params["price_min"]or rx["ADV20_$"]<self.backside_params["adv20_min_usd"]:
            return False
        vol_avg=rx["VOL_AVG"]
        if pd.isna(vol_avg)or vol_avg<=0:
            return False
        vol_sig=max(rx["Volume"]/vol_avg,rx["Prev_Volume"]/vol_avg)
        checks=[
            (rx["TR"]/rx["ATR"])>=self.backside_params["atr_mult"],
            vol_sig>=self.backside_params["vol_mult"],
            rx["Slope_9_5d"]>=self.backside_params["slope5d_min"],
            rx["High_over_EMA9_div_ATR"]>=self.backside_params["high_ema9_mult"],
        ]
        return all(bool(x)and np.isfinite(x)for x in checks)
    def scan_symbol(self,sym,start,end):
        df=self.fetch_data(sym,start,end)
        if df.empty:
            return pd.DataFrame()
        m=self.add_metrics(df)
        rows=[]
        for i in range(2,len(m)):
            d0=m.index[i]
            r0=m.iloc[i]
            r1=m.iloc[i-1]
            r2=m.iloc[i-2]
            lo_abs,hi_abs=self.abs_top_window(m,d0,self.backside_params["abs_lookback_days"],self.backside_params["abs_exclude_days"])
            pos_abs_prev=self.pos_between(r1["Close"],lo_abs,hi_abs)
            if not (pd.notna(pos_abs_prev)and pos_abs_prev<=self.backside_params["pos_abs_max"]):
                continue
            trigger_ok=False
            trig_row=None
            trig_tag="-"
            if self.backside_params["trigger_mode"]=="D1_only":
                if self._check_trigger(r1): trigger_ok,trig_row,trig_tag=True,r1,"D-1"
            else:
                if self._check_trigger(r1): trigger_ok,trig_row,trig_tag=True,r1,"D-1"
                elif self._check_trigger(r2): trigger_ok,trig_row,trig_tag=True,r2,"D-2"
            if not trigger_ok:
                continue
            if not (pd.notna(r1["Body_over_ATR"])and r1["Body_over_ATR"]>=self.backside_params["d1_green_atr_min"]):
                continue
            if self.backside_params["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"])and r1["Volume"]>=self.backside_params["d1_volume_min"]):
                    continue
            if self.backside_params["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"])and r1["VOL_AVG"]>0 and(r1["Volume"]/r1["VOL_AVG"])>=self.backside_params["d1_vol_mult_min"]):
                    continue
            if self.backside_params["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"])and pd.notna(r2["High"])and r1["High"]>r2["High"]
                        and pd.notna(r1["Close"])and pd.notna(r2["Close"])and r1["Close"]>r2["Close"]):
                    continue
            if pd.isna(r0["Gap_over_ATR"])or r0["Gap_over_ATR"]<self.backside_params["gap_div_atr_min"]:
                continue
            if self.backside_params["require_open_gt_prev_high"]and not (r0["Open"]>r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"])or r0["Open_over_EMA9"]<self.backside_params["open_over_ema9_min"]:
                continue
            d1_vol_mult=(r1["Volume"]/r1["VOL_AVG"])if(pd.notna(r1["VOL_AVG"])and r1["VOL_AVG"]>0)else np.nan
            volsig_max=(max(r1["Volume"]/r1["VOL_AVG"],r2["Volume"]/r2["VOL_AVG"])
                           if(pd.notna(r1["VOL_AVG"])and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"])and r2["VOL_AVG"]>0)
                           else np.nan)
            rows.append({
                "Ticker":sym,
                "Date":d0.strftime("%Y-%m-%d"),
                "Trigger":trig_tag,
                "PosAbs_1000d":round(float(pos_abs_prev),3),
                "D1_Body/ATR":round(float(r1["Body_over_ATR"]),2),
                "D1Vol(shares)":int(r1["Volume"])if pd.notna(r1["Volume"])else np.nan,
                "D1Vol/Avg":round(float(d1_vol_mult),2)if pd.notna(d1_vol_mult)else np.nan,
                "VolSig(max D-1,D-2)/Avg":round(float(volsig_max),2)if pd.notna(volsig_max)else np.nan,
                "Gap/ATR":round(float(r0["Gap_over_ATR"]),2),
                "Open>PrevHigh":bool(r0["Open"]>r1["High"]),
                "Open/EMA9":round(float(r0["Open_over_EMA9"]),2),
                "D1>H(D-2)":bool(r1["High"]>r2["High"]),
                "D1Close>D2Close":bool(r1["Close"]>r2["Close"]),
                "Slope9_5d":round(float(r0["Slope_9_5d"]),2)if pd.notna(r0["Slope_9_5d"])else np.nan,
                "High-EMA9/ATR(trigger)":round(float(trig_row["High_over_EMA9_div_ATR"]),2),
                "ADV20_$":round(float(r0["ADV20_$"]))if pd.notna(r0["ADV20_$"])else np.nan,
            })
        return pd.DataFrame(rows)
    def run_scan(self,symbols):
        print(f"Running messy Backside B scan on {len(symbols)} symbols...")
        all_results=[]
        with ThreadPoolExecutor(max_workers=self.max_workers)as executor:
            future_to_symbol={
                executor.submit(self.scan_symbol,sym,self.scan_start,self.scan_end):sym
                for sym in symbols
            }
            for future in as_completed(future_to_symbol):
                sym=future_to_symbol[future]
                try:
                    results=future.result()
                    if not results.empty:
                        all_results.append(results)
                        print(f"✓ {sym}: {len(results)} signals")
                except Exception as e:
                    print(f"✗ {sym}: Error")
        if all_results:
            return pd.concat(all_results,ignore_index=True).sort_values(["Date","Ticker"],ascending=[False,True])
        return pd.DataFrame()

def main():
    scanner=BacksideBMessy()
    test_symbols=['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA']
    print("Testing MESSY Backside B scanner...")
    print("This code has terrible formatting but works!")
    results=scanner.run_scan(test_symbols)
    if not results.empty:
        print(f"\nFound {len(results)} signals!")
        print(results[["Ticker","Date","Gap/ATR","D1Vol/Avg"]])
    else:
        print("\nNo signals found")
    return results

if __name__=="__main__":
    main()
