import React from 'react';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='fixed inset-0 w-screen h-screen overflow-hidden overscroll-y-contain'>
      {children}
    </div>
  );
}
