// Notification System
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = this.createContainer();
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 4000) {
    const notification = this.createNotification(message, type);
    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remove
    setTimeout(() => {
      this.remove(notification);
    }, duration);

    return notification;
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = this.getIcon(type);
    
    notification.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
      <i class="fas fa-times notification-close"></i>
    `;

    // Add click to close
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.remove(notification);
    });

    return notification;
  }

  getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  remove(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Create global notification manager
const notifications = new NotificationManager();

// Button effect utilities
function addButtonEffect(button, callback, options = {}) {
  const {
    loadingText = 'Memproses...',
    successMessage = 'Berhasil!',
    errorMessage = 'Terjadi kesalahan!',
    duration = 1000
  } = options;

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;
    
    const originalText = button.innerHTML;
    
    try {
      // Execute callback
      const result = await callback(e);
      
      // Show success
      notifications.success(successMessage);
      
      return result;
    } catch (error) {
      // Show error
      notifications.error(errorMessage);
      console.error('Button action error:', error);
    } finally {
      // Remove loading state
      setTimeout(() => {
        button.classList.remove('loading');
        button.disabled = false;
      }, duration);
    }
  });
}

// Add ripple effect to buttons
function addRippleEffect(element) {
  element.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Auto-apply effects to all buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add ripple effect to all buttons
  document.querySelectorAll('.btn, .action-btn, .confidence-option').forEach(btn => {
    if (!btn.classList.contains('no-ripple')) {
      addRippleEffect(btn);
    }
  });
});