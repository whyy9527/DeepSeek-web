import { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              break;
            }
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0].delta.content;
            if (delta) {
              assistantMessage.content += delta;
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1] = assistantMessage;
                } else {
                  updated.push(assistantMessage);
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ border: '1px solid #ccc', padding: '10px', minHeight: '200px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.role === 'user' ? '用户' : '助手'}:</strong> {msg.content}
          </div>
        ))}
        {isLoading && <div>助手正在输入...</div>}
      </div>
      <div style={{ marginTop: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={{ width: '80%' }}
        />
        <button onClick={sendMessage} style={{ marginLeft: '10px' }}>
          发送
        </button>
      </div>
    </div>
  );
}

export default App;