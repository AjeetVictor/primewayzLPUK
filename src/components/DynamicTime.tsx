import { useEffect, useState } from 'react';

const DynamicTime = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);
  return <span>{time}</span>;
};

export default DynamicTime;
