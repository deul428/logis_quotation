import React, { useState } from 'react';

import Button from './components/Button';
import ci from './assets/img/logo.svg';
import { BookOpenCheck, PencilLine } from 'lucide-react';

const User: React.FC = () => {
  const [salesManagerName, setSalesManagerName] = useState<string>('');
  const fieldMsg: string = `업체명: 
  
지역: 

1. 상품: / 규격: / 사용량: / 사용금액: / 인쇄:

2. 상품: / 규격: / 사용량: / 사용금액: / 인쇄:

요청사항: `;
  const [content, setContent] = useState(fieldMsg);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showGuide1, setShowGuide1] = useState<boolean>(false);
  const [showGuide2, setShowGuide2] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('문의 내용을 입력해 주세요.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('entry.586019235', salesManagerName);
      formData.append('entry.1839132968', '');
      formData.append('entry.1271596132', content);
      await fetch(
        'https://docs.google.com/forms/d/e/1FAIpQLSctYhlQvrIz8v9g041upLmtKANxDG6vHa8Y23l9VD59j1U1fg/formResponse',
        { method: 'POST', body: formData, mode: 'no-cors' }
      );
      setIsSubmitted(true);
    } catch (err) {
      alert('오류가 발생했습니다. 관리자에게 문의해 주세요.');
      console.error(err);
    }
  };

  const resetForm = () => {
    setSalesManagerName('');
    setContent(fieldMsg);
    setIsSubmitted(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-8 min-h-[100dvh] flex flex-col">
      {/* 카드: 모바일 우선 패딩, 참조 rounded-2xl shadow-2xl border */}
      <div className="bg-transparent sm:bg-white rounded-2xl sm:shadow-2xl p-0 shadow-none sm:p-6 md:p-8 flex-1">
        {/* 헤더: 모바일에서 제목·로고 크기 조정 */}
        <div className="text-center mb-8 sm:mb-10">
          <h3 className="text-xl sm:text-2xl font-extrabold text-red-500 mb-2 tracking-tight">AJ렌탈 로지스</h3>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">유통 견적 문의</h2>
        </div>
        {/* <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            로지스 유통 견적 문의
          </h2>
          <img className="max-w-[140px] sm:max-w-[180px] w-full h-auto" src={ci} alt="AJ 로고" />
        </div> */}

        {!isSubmitted && (
          <div className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  영업 담당자 성함
                </label>
                <input
                  type="text"
                  name="entry.586019235"
                  placeholder="영업 담당자 성함"
                  value={salesManagerName}
                  onChange={(e) => setSalesManagerName(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  문의 내용
                </label>
                <textarea
                  name="entry.1271596132"
                  rows={10}
                  placeholder={`예시)\n업체명: AJ\n지역: 서울 송파구\n1. 상품: 박스 / 규격: W450*H460*0.06MM / 사용량: 약 40,000장\n2. 상품: 테이프 / 규격: W500*H600 / 사용량: 약 20,000롤 / 사용금액: 500,000원\n요청사항: 납기 일정 회신 부탁드립니다.\n\n※ 정보가 없을 경우, 입력하지 않으셔도 됩니다.`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 min-h-[200px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>
              <Button type="submit" variant="primary" fullWidth className="min-h-[48px]">
                문의 요청
              </Button>
            </form>
          </div>
        )}

        {isSubmitted && (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              접수가 완료되었습니다.
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">영업담당자</label>
                <p className="text-base font-bold text-gray-800">{salesManagerName || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">견적 문의 내용</label>
                <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                  {content}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" fullWidth onClick={resetForm} className="min-h-[48px]">
              신규 접수하기
            </Button>
          </div>
        )}

        {!isSubmitted && (
          <div className="mt-6 sm:mt-8 space-y-4">
            <div>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowGuide2(!showGuide2)}
              >
                <BookOpenCheck className="w-4 h-4" /> 입력 시 주의사항 {showGuide2 ? '숨기기' : '보기'}
              </Button>
              {showGuide2 && (
                <div className="mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 leading-relaxed">
                  <p>
                    1. 번호 표기 필수 - 상품/규격별 정보는 반드시 1., 2., 3. 번호를 붙여 구분합니다.<br />
                    2. 상품명 표기 - 동일 상품 + 여러 규격 → 상품:은 한 번만 쓰고 아래에 규격을 나열해도 가능 / 서로 다른 상품 → 각 번호마다 반드시 개별 상품:을 함께 작성<br />
                    3. 필수/선택 항목 - 업체명, 지역, 상품은 필수 / 규격, 사용량, 사용금액, 인쇄, 요청사항 등은 선택 (없는 값은 생략 가능)
                  </p>
                </div>
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowGuide1(!showGuide1)}
              >
                <PencilLine className="w-4 h-4" /> 입력 양식 가이드 {showGuide1 ? '숨기기' : '보기'}
              </Button>
              {showGuide1 && (
                <div className="mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 leading-relaxed">
                  <p>업체명: [회사명]<br />지역: [납품지역]</p>
                  <p className="mt-2">
                    1. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상 사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]<br />
                    2. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상 사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]<br />
                    3. 상품: [상품명] / 규격: [상품의 규격] / 사용량: [월 예상 사용량] / 사용금액: [월 예상 사용금액] / 인쇄: [O/X]
                  </p>
                  <p className="mt-2">요청사항: [납기, 샘플 등 요청사항]</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default User;
