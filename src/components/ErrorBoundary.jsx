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

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const isChunkError = this.state.error?.message?.includes('dynamically imported module') ||
                this.state.error?.message?.includes('Loading chunk') ||
                this.state.error?.message?.includes('Failed to fetch');

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '40px 24px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    gap: '16px',
                    background: '#0f1322',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '4px' }}>
                        {isChunkError ? '📡' : '⚠️'}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e2e8f0', margin: 0 }}>
                        {isChunkError ? 'Mất kết nối' : 'Đã xảy ra lỗi'}
                    </h2>
                    <p style={{ fontSize: '13px', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>
                        {isChunkError
                            ? 'Kết nối bị gián đoạn. Kiểm tra mạng và thử tải lại.'
                            : 'Trang này gặp sự cố. Vui lòng thử lại hoặc quay về trang chủ.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: '1px solid rgba(250, 204, 21, 0.5)',
                                background: 'rgba(250, 204, 21, 0.15)',
                                color: '#facc15',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            🔄 Thử lại
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                background: 'rgba(148, 163, 184, 0.1)',
                                color: '#94a3b8',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            🏠 Trang chủ
                        </button>
                        {isChunkError && (
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#60a5fa',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                ↻ Tải lại trang
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
