'use client';
import {useEffect,useState} from 'react';
export default function Welcome({text,name,onContinue}:{text:string;name:string;onContinue:()=>void}){
 const [speaking,setSpeaking]=useState(false),[supported,setSupported]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setSupported('speechSynthesis' in window);return()=>{if('speechSynthesis' in window)speechSynthesis.cancel();};},[]);
 function speak(){if(speaking){speechSynthesis.cancel();setSpeaking(false);return;}setError('');const utterance=new SpeechSynthesisUtterance(text);utterance.lang='id-ID';utterance.rate=.9;const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('id'));if(voice)utterance.voice=voice;utterance.onstart=()=>setSpeaking(true);utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>{setSpeaking(false);setError('Suara belum tersedia. Kamu tetap bisa membaca sambutannya.');};speechSynthesis.speak(utterance);}
 return <div className="kk-letter"><p>Untuk {name}</p><p>{text}</p>{supported&&<><button className="kk-button secondary" onClick={speak}>{speaking?'Hentikan suara':'Dengarkan teks'}</button><p><small>Dibacakan oleh suara browser.</small></p></>}{error&&<p role="status">{error}</p>}<button className="kk-button" onClick={onContinue}>Lanjut ke karnaval</button></div>;
}
