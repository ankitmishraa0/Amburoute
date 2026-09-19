import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0E172A] border border-[#FF2A54]/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FF2A54]/20 border border-[#FF2A54] flex items-center justify-center mx-auto text-[#FF2A54]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">AmbuRoute Recovery Screen</h2>
            <p className="text-xs text-slate-300">
              An unexpected render issue occurred. Click reload to refresh with safe defaults:
            </p>
            <pre className="text-[10px] text-red-400 bg-black/50 p-3 rounded-lg text-left overflow-x-auto font-mono max-h-32">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#00F5D4] text-slate-950 font-bold text-xs font-mono transition-all hover:opacity-90 flex items-center justify-center space-x-2 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RELOAD MISSION CONTROL</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
