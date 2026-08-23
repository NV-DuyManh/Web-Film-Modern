import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Kiểm tra và cập nhật Service Worker mỗi 60 giây
// Khi phát hiện bản mới → hiện thông báo nhỏ, KHÔNG tự reload
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Kiểm tra update mỗi 60 giây
      setInterval(async () => {
        if (!(!registration.installing && navigator)) return;
        if ('connection' in navigator && !navigator.onLine) return;

        try {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache-control': 'no-cache' },
          });
          if (resp?.status === 200) {
            await registration.update();
          }
        } catch {
          // Bỏ qua lỗi network
        }
      }, 60 * 1000); // 60 giây
    }
  },
  onNeedRefresh() {
    // Hiện thông báo nhỏ thay vì tự reload
    showUpdateToast();
  },
});

function showUpdateToast() {
  // Nếu đã có toast thì không hiện thêm
  if (document.getElementById('pwa-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.innerHTML = `
    <div style="
      position:fixed; bottom:24px; right:24px; z-index:99999;
      background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border:1px solid rgba(99,102,241,0.4);
      border-radius:16px; padding:16px 20px;
      box-shadow:0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.15);
      display:flex; align-items:center; gap:14px;
      font-family:'Inter',system-ui,sans-serif; color:#e2e8f0;
      animation:pwa-slide-in 0.4s cubic-bezier(0.16,1,0.3,1);
      backdrop-filter:blur(12px);
      max-width:360px;
    ">
      <div style="font-size:28px;flex-shrink:0;">✨</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:14px;margin-bottom:3px;">Có phiên bản mới!</div>
        <div style="font-size:12px;color:#94a3b8;">Cập nhật để trải nghiệm tốt hơn</div>
      </div>
      <button id="pwa-update-btn" style="
        background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff;
        border:none; border-radius:10px; padding:8px 16px;
        font-size:13px; font-weight:600; cursor:pointer;
        white-space:nowrap; transition:all 0.2s;
      " onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 15px rgba(99,102,241,0.4)'"
         onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'"
      >Cập nhật</button>
      <button id="pwa-dismiss-btn" style="
        background:none; border:none; color:#64748b;
        cursor:pointer; font-size:18px; padding:4px;
        line-height:1; transition:color 0.2s;
      " onmouseover="this.style.color='#e2e8f0'"
         onmouseout="this.style.color='#64748b'"
      >✕</button>
    </div>
  `;

  // Thêm animation keyframes
  if (!document.getElementById('pwa-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-toast-styles';
    style.textContent = `
      @keyframes pwa-slide-in {
        from { opacity:0; transform:translateY(20px) scale(0.95); }
        to { opacity:1; transform:translateY(0) scale(1); }
      }
      @keyframes pwa-slide-out {
        from { opacity:1; transform:translateY(0) scale(1); }
        to { opacity:0; transform:translateY(20px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Nút "Cập nhật" → reload trang
  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    updateSW(true);
  });

  // Nút đóng → ẩn toast
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    const el = document.getElementById('pwa-update-toast');
    if (el) {
      el.firstElementChild.style.animation = 'pwa-slide-out 0.3s cubic-bezier(0.16,1,0.3,1) forwards';
      setTimeout(() => el.remove(), 300);
    }
  });
}


import CategoryProvider from './contexts/CategoryProvider.jsx';
import CategoryTypeProvider from './contexts/CategoryTypeProvider.jsx';
import PlanProvider from './contexts/PlanProvider.jsx';
import UserProvider from './contexts/UserProvider.jsx';
import AuthProvider from './contexts/AuthProvider.jsx';
import SubscriptionProvider from './contexts/SubscriptionProvider.jsx';

const providers = [
  CategoryProvider,
  CategoryTypeProvider,
  PlanProvider,
  SubscriptionProvider,
  UserProvider,
  AuthProvider
];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        {providers.reduceRight((children, Provider) => {
          return <Provider>{children}</Provider>;
        }, <App />)}
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
