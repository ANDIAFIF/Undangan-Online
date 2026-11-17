'use client';
import {useEffect,useRef} from 'react';
export default function Modal({title,children,onClose,wide=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;const before=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();before?.focus();};},[]);
 return <dialog ref={ref} className={`kk-modal ${wide?'kk-modal-wide':''}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}} aria-label={title}>
 <header><span className="kk-modal-icon" aria-hidden>✦</span><h2>{title}</h2><button className="kk-close" onClick={onClose} aria-label="Tutup">×</button></header><div className="kk-modal-body">{children}</div></dialog>;
}
