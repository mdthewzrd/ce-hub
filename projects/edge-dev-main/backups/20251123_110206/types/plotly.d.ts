declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export default class Plot extends Component<PlotParams> {}
}