import React from 'react';
import Button from './Button';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#000082] text-white flex flex-col items-center justify-center p-8 font-mono">
                    <div className="max-w-4xl w-full">
                        <h1 className="text-[10rem] leading-none mb-8 font-light">:(</h1>

                        <h2 className="text-3xl font-light mb-8">
                            A problem has been detected and Vista has been shut down to prevent damage to your computer.
                        </h2>

                        <div className="mb-8 font-bold">
                            <p className="mb-4">
                                The problem seems to be caused by the following file: {this.state.error?.message || "Unknown Error"}
                            </p>
                        </div>

                        <div className="mb-8">
                            <p className="mb-2">If this is the first time you've seen this error screen, restart your computer. If this screen appears again, follow these steps:</p>

                            <ul className="list-disc ml-6 mb-4 space-y-2">
                                <li>Check to make sure any new hardware or software is properly installed.</li>
                                <li>If this is a new installation, ask your hardware or software manufacturer for any Vista updates you might need.</li>
                                <li>If problems continue, disable or remove any newly installed hardware or software.</li>
                                <li>Disable BIOS memory options such as caching or shadowing.</li>
                                <li>If you need to use Safe Mode to remove or disable components, restart your computer, press F8 to select Advanced Startup Options, and then select Safe Mode.</li>
                            </ul>
                        </div>

                        <div className="mb-8 font-mono text-sm bg-[#000082] border-t border-white/20 pt-4">
                            <p className="mb-2">Technical Information:</p>
                            <p className="mb-1">*** STOP: 0x00000050 (0xFD3094C2, 0x00000001, 0xFBFE7617, 0x00000000)</p>
                            {this.state.error && (
                                <p className="text-yellow-300 font-bold mb-1">
                                    *** {this.state.error.toString()}
                                </p>
                            )}
                            {this.state.errorInfo && (
                                <pre className="text-xs opacity-70 overflow-auto max-h-40 whitespace-pre-wrap">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 border-2 border-white text-white hover:bg-white hover:text-[#000082] transition-colors font-bold uppercase tracking-wider"
                            >
                                Restart Vista
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-2 border-2 border-white text-white hover:bg-white hover:text-[#000082] transition-colors font-bold uppercase tracking-wider"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
