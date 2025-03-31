import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import Login from './Login';
import Register from './Register';

const Welcome = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const navigate = useNavigate();

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="relative w-full max-w-lg aspect-square border-[16px] border-[#A9A29A] flex flex-col items-center justify-center p-8">
        {/* Welcome text section */}
        <div className="text-center mb-6">
          <p className="text-sm uppercase tracking-widest text-[#666666] mb-1">WELCOME</p>
          <p className="text-xs uppercase tracking-widest text-[#666666] mb-4">to</p>
          
          {/* AESTHENDA in bold banner */}
          <div className="relative py-1.5 mb-4">
            <div className="absolute inset-0 bg-[#A9A29A] z-0"></div>
            <h1 className="relative z-10 font-serif text-3xl uppercase tracking-widest text-center text-black font-medium">AESTHENDA</h1>
          </div>
          
          {/* Subtle line */}
          <div className="w-full max-w-[240px] h-px bg-[#A9A29A] mx-auto mb-8"></div>
        </div>
        
        {/* Color palette */}
        <div className="flex items-center justify-center gap-1 mb-12">
          <div className="w-4 h-4 bg-[#A9A29A]"></div>
          <div className="w-4 h-4 bg-[#BEBCBB]"></div>
          <div className="w-4 h-4 bg-[#D2D0D1]"></div>
          <div className="w-4 h-4 bg-[#C0A371]"></div>
        </div>
        
        {/* Login/Register buttons */}
        <div className="flex justify-center items-center gap-8">
          <button 
            onClick={openLoginModal}
            className="px-4 py-1 bg-[#A9A29A] hover:bg-[#918b84] transition-colors duration-200 text-black text-xs uppercase tracking-widest rounded"
          >
            LOGIN
          </button>
          
          <span className="text-[#BEBCBB] text-sm">OR</span>
          
          <button 
            onClick={openRegisterModal}
            className="px-4 py-1 bg-[#A9A29A] hover:bg-[#918b84] transition-colors duration-200 text-black text-xs uppercase tracking-widest rounded"
          >
            SIGN UP
          </button>
        </div>
        
        {/* Bottom version indicator */}
        <div className="absolute bottom-1 text-center w-full">
          <p className="text-[10px] text-[#BEBCBB]">MULTI-TENANT SALON MANAGEMENT</p>
        </div>
      </div>

      {/* Login Modal */}
      <Modal isOpen={isLoginModalOpen} onClose={closeLoginModal}>
        <Login onClose={closeLoginModal} />
      </Modal>

      {/* Register Modal */}
      <Modal isOpen={isRegisterModalOpen} onClose={closeRegisterModal}>
        <Register onClose={closeRegisterModal} />
      </Modal>
    </div>
  );
};

export default Welcome;