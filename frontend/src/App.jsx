import { useEffect, useState, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Mic, PhoneOff, Phone, Activity, AlertCircle, Bot, Sparkles } from 'lucide-react';
import './index.css';

const retellWebClient = new RetellWebClient();

function App() {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('none'); // 'none', 'user', 'agent'
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [visualizerTick, setVisualizerTick] = useState(0);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  
  const timerRef = useRef(null);
  const visualizerIntervalRef = useRef(null);
  const transcriptsEndRef = useRef(null);

  // Setup Retell Web Client Listeners
  useEffect(() => {
    retellWebClient.on('call_started', () => {
      setIsCalling(true);
      setIsConnecting(false);
      startTimer();
      setActiveSpeaker('none');
    });

    retellWebClient.on('call_ended', () => {
      setIsCalling(false);
      setIsConnecting(false);
      stopTimer();
      setActiveSpeaker('none');
    });

    retellWebClient.on('agent_start_talking', () => {
      setActiveSpeaker('agent');
      setIsAgentThinking(false);
    });

    retellWebClient.on('agent_stop_talking', () => {
      if (activeSpeaker === 'agent') setActiveSpeaker('none');
    });

    retellWebClient.on('user_start_talking', () => {
      setActiveSpeaker('user');
      setIsAgentThinking(false);
    });

    retellWebClient.on('user_stop_talking', () => {
      if (activeSpeaker === 'user') setActiveSpeaker('none');
      // When user stops talking, agent starts processing
      setIsAgentThinking(true);
    });

    retellWebClient.on('update', (update) => {
      if (update && update.transcript) {
        setTranscripts(update.transcript);
      }
    });

    retellWebClient.on('error', (err) => {
      console.error('Retell error:', err);
      setError('An error occurred with the call. Please try again.');
      setIsCalling(false);
      setIsConnecting(false);
      stopTimer();
    });

    return () => {
      stopTimer();
      stopVisualizer();
    };
  }, [activeSpeaker]);

  // Handle Visualizer animation
  useEffect(() => {
    if (activeSpeaker !== 'none') {
      startVisualizer();
    } else {
      stopVisualizer();
    }
  }, [activeSpeaker]);

  const startVisualizer = () => {
    if (!visualizerIntervalRef.current) {
      visualizerIntervalRef.current = setInterval(() => {
        setVisualizerTick(prev => prev + 1);
      }, 100);
    }
  };

  const stopVisualizer = () => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
  };

  // Auto-scroll transcripts
  useEffect(() => {
    if (transcriptsEndRef.current) {
      transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCall = async () => {
    setError('');
    setIsConnecting(true);

    try {
      // Request mic permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Fetch web call token from backend
      const response = await fetch('http://localhost:3001/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create web call. Is the backend running?');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Start the call with the SDK
      await retellWebClient.startCall({
        accessToken: data.access_token,
      });

    } catch (err) {
      console.error('Failed to start call:', err);
      setError(err.message || 'Failed to access microphone or start call.');
      setIsConnecting(false);
    }
  };

  const stopCall = () => {
    retellWebClient.stopCall();
  };

  // Generate dynamic visualizer bars
  const renderVisualizer = () => {
    const bars = [];
    const isAgentTalking = activeSpeaker === 'agent';
    const isUserTalking = activeSpeaker === 'user';
    
    for (let i = 0; i < 15; i++) {
      // Randomize height if someone is talking, otherwise flat
      let height = '8px';
      if (isAgentTalking || isUserTalking) {
        const randomHeight = Math.floor(Math.random() * 80) + 10;
        height = `${randomHeight}px`;
      }

      bars.push(
        <div 
          key={i} 
          className={`bar ${activeSpeaker !== 'none' ? 'active-speaker' : ''}`}
          style={{ 
            height,
            transitionDelay: `${i * 0.02}s`
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="app-container">
      <div className="ambient-bg"></div>
      
      {/* Header */}
      <header className="header">
        <div className="title">
          <Bot className="logo-icon" size={28} />
          Retell.AI Assistant
        </div>

        {(isCalling || isConnecting) && (
          <div className="timer">
            {formatTime(callDuration)}
          </div>
        )}

        <div className={`status-badge ${isCalling ? 'active' : isConnecting ? 'connecting' : ''}`}>
          <div className="status-indicator"></div>
          {isConnecting ? 'Connecting...' : isCalling ? 'Call Active' : 'Ready'}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!isCalling && !isConnecting ? (
          <div className="welcome-state">
            <div className="welcome-icon">
              <Sparkles size={40} />
            </div>
            <h1 className="welcome-title">Voice AI Agent</h1>
            <p className="welcome-subtitle">
              Start a conversation with our intelligent voice assistant. 
              Powered by Retell.AI and featuring real-time transcription.
            </p>
          </div>
        ) : (
          <>
            <div className="visualizer-container">
              <div className="visualizer">
                {renderVisualizer()}
              </div>
            </div>

            <div className="transcripts-area">
              {transcripts.map((msg, index) => {
                // Determine if message is from user or agent
                const isAgent = msg.role === 'agent';
                return (
                  <div key={index} className={`message ${isAgent ? 'agent' : 'user'}`}>
                    <span className="message-sender">{isAgent ? 'Agent' : 'You'}</span>
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {transcripts.length === 0 && !isAgentThinking && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 'auto', marginBottom: 'auto' }}>
                  Listening...
                </div>
              )}
              {isAgentThinking && (
                <div className="message agent thinking-indicator">
                  <span className="message-sender">Agent</span>
                  <div className="message-bubble typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              )}
              <div ref={transcriptsEndRef} />
            </div>
          </>
        )}
      </main>

      {/* Controls Area */}
      <footer className="controls-area">
        {!isCalling && !isConnecting ? (
          <button className="btn-start" onClick={startCall} disabled={isConnecting}>
            <Phone size={20} />
            Start Conversation
          </button>
        ) : (
          <button className="btn-end" onClick={stopCall}>
            <PhoneOff size={20} />
            End Call
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
