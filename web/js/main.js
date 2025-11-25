// 공통 fragment 로더 (header/footer)
function loadFragment(targetId, url) {
    const container = document.getElementById(targetId);
    if (!container) return;

    fetch(url)
        .then(res => res.text())
        .then(html => {
            container.innerHTML = html;
        })
        .catch(err => {
            console.error('Fragment load error:', url, err);
        });
}

// 업로드 섹션으로 스크롤
function scrollToUpload() {
    const section = document.getElementById('upload');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// 파일 업로드 처리 (데모용)
function handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (file) {
        // TODO: 나중에 여기서 서버에 업로드 + AI 분석 API 호출
        setTimeout(() => {
            const modal = document.getElementById('resultModal');
            if (modal) {
                modal.classList.add('active');
            }
        }, 1000);
    }
}

function closeModal() {
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// FAQ 아코디언 기능
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // 모든 FAQ 아이템 닫기
            faqItems.forEach(faq => {
                faq.classList.remove('active');
            });
            
            // 클릭한 아이템이 비활성 상태였다면 열기
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// 스크롤 애니메이션
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
        '.feature-card, .testimonial-card, .step, .faq-item, .big-stat-card'
    );

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 카운터 애니메이션
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

function initCounters() {
    const counters = document.querySelectorAll('.big-stat-number');
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const text = entry.target.textContent;
                let targetValue = 0;

                if (text.includes('K')) {
                    targetValue = parseFloat(text.replace('K+', '')) * 1000;
                } else if (text.includes('M')) {
                    targetValue = parseFloat(text.replace('M+', '')) * 1000000;
                } else if (text.includes('/')) {
                    return; // 4.8/5 같은 경우는 애니메이션 스킵
                } else {
                    targetValue = parseInt(text.replace(/[^0-9]/g, ''));
                }

                entry.target.dataset.animated = 'true';
                animateCounter(entry.target, targetValue);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// ✅ 하나로 합친 DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // header / footer 로드
    loadFragment('header-placeholder', 'partials/header.html');
    loadFragment('footer-placeholder', 'partials/footer.html');

    // 파일 업로드 input 이벤트
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // 모달 바깥 클릭 시 닫기
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // 모달 내부 닫기 버튼
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // ✨ 새로 추가된 기능들
    initFAQ();
    initScrollAnimations();
    initCounters();
});