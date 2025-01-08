import React from 'react';

const ViewToggleButton = ({ isGridView, onClick }) => {
  return (
    <button className="view-toggle" onClick={onClick}>
      {isGridView ? '스택 뷰로 보기' : '그리드 뷰로 보기'}
    </button>
  );
};

export default ViewToggleButton; 