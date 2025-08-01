// src/components/ui/TimelineItem.jsx

import React from 'react';

const TimelineItem = ({ id, title, description, time }) => {
  return (
    <div className="timeline-item">
      <span className="item-id">{id}</span>
      <h3 className="item-title">{title}</h3>
      {description && <p className="item-description">{description}</p>}
      <time className="item-time">{time}</time>
    </div>
  );
};

export default TimelineItem;