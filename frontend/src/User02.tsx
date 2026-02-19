import React, { useState } from 'react';

import Button from './components/Button'; 
import { BookOpenCheck, PencilLine, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  productName: string;
  spec: string;
  usage: string;
  amount: string;
  print: string;
}

/** User02 전용: GAS 백엔드(또는 프록시) URL. Manager과 동일한 프록시 사용 시 같은 값. */
const USER02_API_URL =
  typeof process !== 'undefined' && process.env?.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : 'https://icy-sea-0bb9.kkhhsq.workers.dev';

const User02: React.FC = () => {
  const [salesRep, setSalesRep] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showGuide1, setShowGuide1] = useState<boolean>(false);
  const [showGuide2, setShowGuide2] = useState<boolean>(false);
  const [inputCompany, setInputCompany] = useState<string>('');
  const [inputRegion, setInputRegion] = useState<string>('');
  const [inputNote, setInputNote] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([
    { id: 1, productName: '', spec: '', usage: '', amount: '', print: '' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRep.trim()) {
      alert('영업 담당자를 입력해 주세요.');
      return;
    }

    if (!inputCompany.trim()) {
      alert('업체명을 입력해 주세요.');
      return;
    }

    if (!inputRegion.trim()) {
      alert('지역(착지)를 입력해 주세요.');
      return;
    }

    if (products.length === 0) {
      alert('상품을 추가해 주세요.');
      return;
    }

    const payloadText = `업체명: ${inputCompany}
지역: ${inputRegion}
요청사항: ${inputNote}

${products
  .map((p, idx) => `${idx + 1}. 상품: ${p.productName} / 규격: ${p.spec} / 사용량: ${p.usage} / 사용금액: ${p.amount} / 인쇄: ${p.print}`)
  .join('\n')}`;
    setContent(payloadText);

    setSubmitError('');
    try {
      const body = {
        mode: 'user02',
        salesRep: salesRep.trim(),
        company: inputCompany.trim(),
        region: inputRegion.trim(),
        note: inputNote.trim(),
        products: products.map((p) => ({
          productName: p.productName || '',
          spec: p.spec || '',
          usage: p.usage || '',
          amount: p.amount || '',
          print: p.print || '',
        })),
      };
      const res = await fetch(USER02_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (result.status === 'ok') {
        setIsSubmitted(true);
      } else {
        setSubmitError(result.message || '저장에 실패했습니다.');
      }
    } catch (err) {
      setSubmitError('오류가 발생했습니다. 관리자에게 문의해 주세요.');
      console.error(err);
    }
  };

  const addProduct = () => {
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    setProducts([
      ...products,
      { id: newId, productName: '', spec: '', usage: '', amount: '', print: '' },
    ]);
  };

  const removeProduct = (id: number) => {
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const updateProduct = (id: number, field: keyof Product, value: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const resetForm = () => {
    setSalesRep('');
    setInputCompany('');
    setInputRegion('');
    setInputNote('');
    setContent('');
    setProducts([{ id: 1, productName: '', spec: '', usage: '', amount: '', print: '' }]);
    setIsSubmitted(false);
    setSubmitError('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-8 min-h-[100dvh] flex flex-col">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 md:p-8 flex-1">
        {/* 헤더: 모바일에서 제목·로고 크기 조정 */}
        <div className="text-center mb-8 sm:mb-10">
          <h3 className="text-xl sm:text-2xl font-extrabold text-red-500 mb-2 tracking-tight">AJ렌탈 로지스</h3>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">유통 견적 문의</h2>
        </div>
        {!isSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className='gap-4 grid grid-cols-1 lg:grid-cols-3'>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">영업 담당자명</label>
                <input
                  type="text"
                  placeholder="ex) 김아주"
                  value={salesRep}
                  onChange={(e) => setSalesRep(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">업체명</label>
                <input
                  type="text"
                  placeholder="ex) AJ네트웍스"
                  value={inputCompany}
                  onChange={(e) => setInputCompany(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">지역(착지)</label>
                <input
                  type="text"
                  placeholder="ex) 서울특별시 송파구 정의로8길 9"
                  value={inputRegion}
                  onChange={(e) => setInputRegion(e.target.value)}
                  className="w-full px-4 py-3 min-h-[48px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 상품: 모바일 1열, sm 이상 2열 (참조 grid 패턴) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">상품</label>
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="mb-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-800">상품 {index + 1}</h4>
                    {products.length > 1 && (
                      <Button
                        type="button"
                        variant="icon"
                        className='text-red-500 focus:text-red-500 active:text-red-500'
                        onClick={() => window.confirm('정말 삭제하시겠습니까?') && removeProduct(product.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">상품명</label>
                      <input
                        type="text"
                        placeholder="ex) 박스"
                        value={product.productName}
                        onChange={(e) => updateProduct(product.id, 'productName', e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">규격</label>
                      <input
                        type="text"
                        placeholder="ex) W450*H460*0.06MM"
                        value={product.spec}
                        onChange={(e) => updateProduct(product.id, 'spec', e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">사용량</label>
                      <input
                        type="text"
                        placeholder="ex) 약 40,000장"
                        value={product.usage}
                        onChange={(e) => updateProduct(product.id, 'usage', e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">사용 금액</label>
                      <input
                        type="text"
                        placeholder="ex) 500,000원"
                        value={product.amount}
                        onChange={(e) => updateProduct(product.id, 'amount', e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-600 mb-1">인쇄</label>
                      <input
                        type="text"
                        placeholder="ex) O 또는 X"
                        value={product.print}
                        onChange={(e) => updateProduct(product.id, 'print', e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="warning" fullWidth className="min-h-[48px]" onClick={addProduct}>
                + 상품 추가
              </Button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">요청사항</label>
              <textarea
                rows={3}
                placeholder="ex) 납기 일정 회신 부탁드립니다."
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                className="w-full px-4 py-3 min-h-[80px] text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>

            {submitError && (
              <p className="text-red-600 text-sm font-medium">{submitError}</p>
            )}

            <Button type="submit" variant="primary" fullWidth className="min-h-[48px]">
              문의 요청
            </Button>
          </form>
        )}

        {isSubmitted && (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              접수가 완료되었습니다.
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">영업담당자</label>
                <p className="text-base font-bold text-gray-800">{salesRep || '미입력'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">견적 문의 내용</label>
                <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{content || '-'}</p>
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

export default User02;
