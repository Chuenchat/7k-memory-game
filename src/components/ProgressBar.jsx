const ProgressBar = ({ current, total, label }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full mb-6 p-4 bg-white rounded-lg border border-gray-200">
      {label && <div className="text-sm text-gray-700 mb-2">{label}</div>}
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && `${percentage}%`}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Frame {current} / {total}
      </div>
    </div>
  );
};

export default ProgressBar;
