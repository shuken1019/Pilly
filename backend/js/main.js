axios.get("http://127.0.0.1:8000/pills?keyword=타이레놀")
    .then(res => console.log(res.data));


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
    // ===== Search Functionality =====
    
    // Tab switching
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchContents = document.querySelectorAll('.search-content');
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            searchTabs.forEach(t => t.classList.remove('active'));
            searchContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${targetTab}-search`).classList.add('active');
        });
    });

    // Name Search
    const nameSearchInput = document.getElementById('nameSearchInput');
    const nameSearchBtn = document.getElementById('nameSearchBtn');
    const nameClearBtn = document.getElementById('nameClearBtn');

    if (nameSearchBtn && nameSearchInput) {
        nameSearchBtn.addEventListener('click', async () => {
            const keyword = nameSearchInput.value.trim();
            if (!keyword) {
                alert('약 이름을 입력해주세요.');
                return;
            }
            try {
                const res = await axios.get(`http://127.0.0.1:8000/pills?keyword=${keyword}`);
                console.log('약 이름 검색 결과:', res.data);
                // TODO: 결과를 화면에 표시하는 기능 추가
                alert(`검색 완료: ${res.data.length || 0}개의 결과`);
            } catch (error) {
                console.error('검색 오류:', error);
                alert('검색 중 오류가 발생했습니다.');
            }
        });

        // Enter key search
        nameSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                nameSearchBtn.click();
            }
        });
    }

    if (nameClearBtn && nameSearchInput) {
        nameClearBtn.addEventListener('click', () => {
            nameSearchInput.value = '';
            nameSearchInput.focus();
        });
    }

    // Mark Search (식별문자)
    const frontMarkInput = document.getElementById('frontMarkInput');
    const backMarkInput = document.getElementById('backMarkInput');
    const markSearchBtn = document.getElementById('markSearchBtn');

    if (markSearchBtn) {
        markSearchBtn.addEventListener('click', async () => {
            const frontMark = frontMarkInput.value.trim();
            const backMark = backMarkInput.value.trim();
            
            if (!frontMark && !backMark) {
                alert('앞면 또는 뒷면 글자를 하나 이상 입력해주세요.');
                return;
            }

            try {
                let url = 'http://127.0.0.1:8000/pills?';
                if (frontMark) url += `front_mark=${frontMark}&`;
                if (backMark) url += `back_mark=${backMark}`;
                
                const res = await axios.get(url);
                console.log('식별문자 검색 결과:', res.data);
                // TODO: 결과를 화면에 표시하는 기능 추가
                alert(`검색 완료: ${res.data.length || 0}개의 결과`);
            } catch (error) {
                console.error('검색 오류:', error);
                alert('검색 중 오류가 발생했습니다.');
            }
        });
    }

    // Visual Search (색/모양)
    const colorFilter = document.getElementById('colorFilter');
    const shapeFilter = document.getElementById('shapeFilter');
    const visualSearchBtn = document.getElementById('visualSearchBtn');

    if (visualSearchBtn) {
        visualSearchBtn.addEventListener('click', async () => {
            const color = colorFilter.value;
            const shape = shapeFilter.value;
            
            if (!color && !shape) {
                alert('색상 또는 모양을 하나 이상 선택해주세요.');
                return;
            }

            try {
                let url = 'http://127.0.0.1:8000/pills?';
                if (color) url += `color=${color}&`;
                if (shape) url += `shape=${shape}`;
                
                const res = await axios.get(url);
                console.log('색/모양 검색 결과:', res.data);
                // TODO: 결과를 화면에 표시하는 기능 추가
                alert(`검색 완료: ${res.data.length || 0}개의 결과`);
            } catch (error) {
                console.error('검색 오류:', error);
                alert('검색 중 오류가 발생했습니다.');
            }
        });
    }

    // ===== End Search Functionality =====

    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if(searchBtn && searchInput){
        searchBtn.addEventListener('click',async() => {
        const keyword = searchInput.value;
        const res= await axios.get(`http://127.0.0.1:8000/pills?keyword=${keyword}`);
        console.log(res.data);
    });
}
    
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
            if (e.target === modal) closeModal();
            
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