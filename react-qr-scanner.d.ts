declare module "react-qr-scanner" {
  import { Component } from "react";

  interface QrReaderProps {
    delay?: number | false;
    onError?: (error: any) => void;
    onScan?: (data: any) => void;
    style?: React.CSSProperties;
    constraints?: MediaStreamConstraints;
  }

  export default class QrReader extends Component<QrReaderProps> {}
}
