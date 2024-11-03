import { getStatistics } from "@/lib/api";
import { Statistics } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ResultModalProps {
  isVictory: boolean;
  playTime: number;
  handleOnClose: { onClose: () => void };
}

const ResultModal: React.FC<ResultModalProps> = ({ isVictory, playTime, handleOnClose: { onClose } }) => {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, error } = useQuery<Statistics, Error>({ queryKey: ['statistics'], queryFn: getStatistics }, queryClient);

  if (isLoading) return <div className="text-center py-4">통계 로딩 중...</div>;
  if (error) return <div className="text-center py-4 text-red-500">통계 로딩 오류: {error.message}</div>;
  if (!stats) return null;

  const { totalGames, totalVictories, winRate, guessDistribution } = stats;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            {isVictory ? '축하합니다!' : '아쉽네요!'}
          </h2>
          <p className="text-lg text-center mb-6">플레이 시간: {playTime}초</p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">게임 통계</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-bold text-lg">{totalGames}</p>
                <p className="text-sm text-gray-600">총 게임</p>
              </div>
              <div>
                <p className="font-bold text-lg">{totalVictories}</p>
                <p className="text-sm text-gray-600">승리</p>
              </div>
              <div>
                <p className="font-bold text-lg">{winRate}%</p>
                <p className="text-sm text-gray-600">승률</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">추측 분포</h3>
            {Object.entries(guessDistribution).map(([guesses, count]) => (
              <div key={guesses} className="flex items-center mb-2">
                <span className="w-8 text-right mr-2">{guesses}:</span>
                <div className="flex-grow bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 rounded-full h-4"
                    style={{ width: `${(count / totalGames) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2">{count}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
