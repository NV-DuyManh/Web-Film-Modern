import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Check if it's a chunk loading error (dynamic import failure)
            const isChunkError = this.state.error?.message?.includes('dynamically imported module') ||
                this.state.error?.message?.includes('Loading chunk') ||
                this.state.error?.message?.includes('Failed to fetch');

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    padding: '24px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    gap: '12px',
                    background: '#111827',
                }}>
                    <p style={{ fontSize: '14px', maxWidth: '400px' }}>
                        {isChunkError
                            ? 'Kết nối bị gián đoạn. Vui lòng thử tải lại.'
                            : 'Đã xảy ra lỗi không mong muốn.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: '1px solid rgba(250, 204, 21, 0.5)',
                                background: 'rgba(250, 204, 21, 0.15)',
                                color: '#facc15',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Thử lại
                        </button>
                        {isChunkError && (
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    background: 'rgba(148, 163, 184, 0.1)',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Tải lại trang
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
