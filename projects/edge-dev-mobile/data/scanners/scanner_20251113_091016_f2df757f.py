def adjust_intraday(df):
    #df=pd.DataFrame(results)
    df['date_time']=pd.to_datetime(df['t']*1000000).dt.tz_localize('UTC')
    df['date_time']=df['date_time'].dt.tz_convert('US/Eastern')

    #df['Date Time'] = pd.to_datetime(df['Date Time'])

    # format the datetime objects to "yyyy-mm-dd hh:mm:ss" format
    df['date_time'] = df['date_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
    df['date_time'] = pd.to_datetime(df['date_time'])

    # df=df.set_index(['date_time']).asfreq('1min')
    # df.v = df.v.fillna(0)
    # df[['c']] = df[['c']].ffill()
    # df['h'].fillna(df['c'], inplace=True)
    # df['l'].fillna(df['c'], inplace=True)
    # df['o'].fillna(df['c'], inplace=True)
    # df=df.between_time('04:00', '20:00')
    # df = df.reset_index(level=0)

    df['time'] = pd.to_datetime(df['date_time']).dt.time
    df['date'] = pd.to_datetime(df['date_time']).dt.date

    # daily_v_sum = df.groupby(df['date_time'].dt.date)['v'].sum()
    # valid_dates = daily_v_sum[daily_v_sum > 0].index
    # df = df[df['date_time'].dt.date.isin(valid_dates)]
    # # df = df.reset_index(level=0)
    # df = df.reset_index(drop=True)

    

    df['time_int'] = df['date_time'].dt.hour * 100 + df['date_time'].dt.minute
    df['date_int'] = df['date_time'].dt.strftime('%Y%m%d').astype(int)

    
    
    df['date_time_int'] = df['date_int'].astype(str) + '.' + df['time_int'].astype(str)
    df['date_time_int'] = df['date_time_int'].astype(float)

    
    df['v_sum'] = df.groupby('date')['v'].cumsum()
    
    df['hod_all'] = df.groupby(df['date'])['h'].cummax().fillna(0)

    

    return df