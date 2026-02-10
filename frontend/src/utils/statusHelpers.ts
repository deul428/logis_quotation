/**
 * 견적 진행 상태별 배지 스타일 (Tailwind CSS)
 * orderingHelpers.getStatusColor 스타일과 동일한 패턴 적용
 */
export function getStatusColor(status: string): string {
  const normalized = (status || "").trim();
  console.log(normalized);
  const colors: Record<string, string> = {
    '접수전' : '!bg-red-100 !text-red-800',
    '접수중': '!bg-yellow-100 !text-yellow-800',
    // '접수진행중': 'bg-blue-100 text-blue-800',
    // '발주완료(납기미정)': 'bg-cyan-100 text-cyan-800',
    '발송완료': '!bg-green-100 !text-green-800',
    '접수취소': 'bg-gray-100 text-gray-800',

  };
  return colors[normalized] || "bg-gray-100 text-gray-800";
}
