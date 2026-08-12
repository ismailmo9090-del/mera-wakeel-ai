import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  override props: Props;
  // @ts-ignore
  override state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4 font-sans text-[#2B2B26]">
          <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl p-8 border-2 border-[#E3DCC9] shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#1F2E4A] text-[#E4CE85] flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-8 h-8 text-[#D98800]" />
            </div>

            <div className="space-y-2">
              <h2 className="font-fraunces text-2xl font-bold text-[#1F2E4A]">
                कुछ तकनीकी दिक्कत आ गई
              </h2>
              <p className="text-sm text-[#2B2B26]/80 leading-relaxed">
                Something unexpected happened. Please reload the page to continue your legal consultation safely.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full bg-[#1F2E4A] hover:bg-[#152238] text-[#E4CE85] font-bold py-3.5 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#E4CE85]" />
              <span>पेज रीलोड करें (Reload Page)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
