import React from 'react';
import './Loader.css';

const Loader = () => (
  <div className="loader-wrapper">
    <div className="loader-inner">
      <div className="circle circle1" />
      <div className="circle circle2" />
      <div className="circle circle3" />
      <div className="shadow shadow1" />
      <div className="shadow shadow2" />
      <div className="shadow shadow3" />
    </div>
  </div>
);

export default Loader;
