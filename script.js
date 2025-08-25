// 불참 데이터를 저장할 배열
let absenceData = [];

// 페이지 로드 시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadAbsenceData();
    
    // 현재 페이지가 view.html인 경우 테이블 업데이트
    if (window.location.pathname.includes('view.html')) {
        updateAbsenceTable();
        updateStats();
    }
});

// 불참 신청 함수
function submitAbsence() {
    const studentSelect = document.getElementById('studentSelect');
    const reasonSelect = document.getElementById('reasonSelect');
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
    
    // 유효성 검사
    if (!studentSelect.value) {
        alert('학생을 선택해주세요.');
        return;
    }
    
    if (checkboxes.length === 0) {
        alert('불참 시간을 선택해주세요.');
        return;
    }
    
    if (!reasonSelect.value) {
        alert('불참 사유를 선택해주세요.');
        return;
    }
    
    // 선택된 시간들
    const selectedPeriods = Array.from(checkboxes).map(cb => cb.value);
    
    // 현재 시간
    const now = new Date();
    const timestamp = now.toLocaleString('ko-KR');
    
    // 불참 데이터 생성
    const absence = {
        id: Date.now(), // 고유 ID
        student: studentSelect.value,
        periods: selectedPeriods,
        reason: reasonSelect.value,
        timestamp: timestamp,
        date: now.toISOString().split('T')[0] // 날짜만 저장
    };
    
    // 데이터 추가
    absenceData.push(absence);
    
    // 로컬 스토리지에 저장
    saveAbsenceData();
    
    // 폼 초기화
    studentSelect.value = '';
    reasonSelect.value = '';
    checkboxes.forEach(cb => cb.checked = false);
    
    alert('불참 신청이 완료되었습니다.');
}

// 데이터를 로컬 스토리지에 저장
function saveAbsenceData() {
    localStorage.setItem('absenceData', JSON.stringify(absenceData));
}

// 로컬 스토리지에서 데이터 불러오기
function loadAbsenceData() {
    const saved = localStorage.getItem('absenceData');
    if (saved) {
        absenceData = JSON.parse(saved);
    }
}

// 학번 추출 함수
function extractStudentNumber(studentString) {
    const match = studentString.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// 불참 테이블 업데이트
function updateAbsenceTable(filteredData = null) {
    const tableBody = document.getElementById('absenceTableBody');
    if (!tableBody) return;
    
    // 데이터 정렬 (학번 순)
    let dataToShow = filteredData || absenceData;
    dataToShow.sort((a, b) => {
        const aNum = extractStudentNumber(a.student);
        const bNum = extractStudentNumber(b.student);
        return aNum - bNum;
    });
    
    // 테이블 내용 초기화
    tableBody.innerHTML = '';
    
    // 데이터가 없으면 메시지 표시
    if (dataToShow.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = '불참 신청이 없습니다.';
        cell.style.textAlign = 'center';
        cell.style.color = '#888';
        return;
    }
    
    // 각 불참 데이터를 테이블에 추가
    dataToShow.forEach(absence => {
        const row = tableBody.insertRow();
        
        // 학번과 이름 분리
        const studentMatch = absence.student.match(/^(\d+)\s+(.+)$/);
        const studentNumber = studentMatch ? studentMatch[1] : '';
        const studentName = studentMatch ? studentMatch[2] : absence.student;
        
        row.innerHTML = `
            <td>${studentNumber}</td>
            <td>${studentName}</td>
            <td>${absence.periods.join(', ')}</td>
            <td>${absence.reason}</td>
            <td>${absence.timestamp}</td>
            <td><button onclick="deleteAbsence(${absence.id})" class="delete-btn">삭제</button></td>
        `;
    });
}

// 통계 업데이트
function updateStats() {
    const totalAbsent = document.getElementById('totalAbsent');
    const firstPeriod = document.getElementById('firstPeriod');
    const secondPeriod = document.getElementById('secondPeriod');
    const thirdPeriod = document.getElementById('thirdPeriod');
    
    if (!totalAbsent) return;
    
    // 총 불참 인원 (중복 제거)
    const uniqueStudents = new Set(absenceData.map(item => item.student));
    totalAbsent.textContent = uniqueStudents.size;
    
    // 각 시간대별 불참 인원
    let firstCount = 0, secondCount = 0, thirdCount = 0;
    
    absenceData.forEach(item => {
        if (item.periods.includes('1차')) firstCount++;
        if (item.periods.includes('2차')) secondCount++;
        if (item.periods.includes('3차')) thirdCount++;
    });
    
    firstPeriod.textContent = firstCount;
    secondPeriod.textContent = secondCount;
    thirdPeriod.textContent = thirdCount;
}

// 필터 적용
function applyFilter() {
    const periodFilter = document.getElementById('periodFilter').value;
    const reasonFilter = document.getElementById('reasonFilter').value;
    
    let filteredData = absenceData;
    
    // 시간 필터
    if (periodFilter) {
        filteredData = filteredData.filter(item => 
            item.periods.includes(periodFilter)
        );
    }
    
    // 사유 필터
    if (reasonFilter) {
        filteredData = filteredData.filter(item => 
            item.reason === reasonFilter
        );
    }
    
    updateAbsenceTable(filteredData);
}

// 필터 초기화
function clearFilter() {
    document.getElementById('periodFilter').value = '';
    document.getElementById('reasonFilter').value = '';
    updateAbsenceTable();
}

// CSV 다운로드
function exportToCSV() {
    if (absenceData.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }
    
    // CSV 헤더
    let csvContent = '학번,이름,불참시간,사유,신청시간\n';
    
    // 데이터 정렬 (학번 순)
    const sortedData = [...absenceData].sort((a, b) => {
        const aNum = extractStudentNumber(a.student);
        const bNum = extractStudentNumber(b.student);
        return aNum - bNum;
    });
    
    // CSV 데이터 추가
    sortedData.forEach(absence => {
        const studentMatch = absence.student.match(/^(\d+)\s+(.+)$/);
        const studentNumber = studentMatch ? studentMatch[1] : '';
        const studentName = studentMatch ? studentMatch[2] : absence.student;
        
        csvContent += `${studentNumber},${studentName},"${absence.periods.join(', ')}",${absence.reason},${absence.timestamp}\n`;
    });
    
    // 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `야자불참현황_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

    // 필터 변경 시 자동 적용
    document.addEventListener('DOMContentLoaded', function() {
        const periodFilter = document.getElementById('periodFilter');
        const reasonFilter = document.getElementById('reasonFilter');
        
        if (periodFilter) {
            periodFilter.addEventListener('change', applyFilter);
        }
        
        if (reasonFilter) {
            reasonFilter.addEventListener('change', applyFilter);
        }
    });

// 개별 불참 삭제 함수
function deleteAbsence(id) {
    if (confirm('정말로 이 불참 신청을 삭제하시겠습니까?')) {
        absenceData = absenceData.filter(item => item.id !== id);
        saveAbsenceData();
        updateAbsenceTable();
        updateStats();
        alert('삭제되었습니다.');
    }
}

// 전체 데이터 초기화 함수
function clearAllData() {
    if (confirm('정말로 모든 불참 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        absenceData = [];
        saveAbsenceData();
        updateAbsenceTable();
        updateStats();
        alert('모든 데이터가 초기화되었습니다.');
    }
}
