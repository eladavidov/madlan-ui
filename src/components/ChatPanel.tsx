"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, MessageCircle } from "lucide-react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showHeader?: boolean;
}

export default function ChatPanel({ isOpen, onClose, showHeader = true }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([]);

  const sampleQuestions = [
    "חפש לי דירת 3 חדרים בחיפה עד 2 מיליון שקל",
    "דירה עם גינה ליד בתי ספר באזור המרכז",
    "פנטהאוז עם מרפסת גדולה בתל אביב",
    "דירת גן עם חניה ומחסן בראשון לציון"
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { type: 'user', content: message }]);
      setMessage("");

      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: "אני מחפש עבורכם דירות שמתאימות לקריטריונים שלכם. הנה מה שמצאתי..."
        }]);
      }, 1000);
    }
  };

  const handleQuestionClick = (question: string) => {
    setMessage(question);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - conditionally rendered */}
      {showHeader && (
        <div className="bg-primary text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6" />
            <h2 className="text-lg font-semibold">שוחח עם AI</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">ברוכים הבאים לצ'אט AI</h3>
                  <p className="text-gray-600 text-sm">
                    בחרו שאלה מהרשימה למטה או כתבו שאלה משלכם
                  </p>
                </div>

                {/* Sample Questions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700 mb-3">שאלות לדוגמה:</h4>
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(question)}
                      className="w-full p-3 text-right bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתבו את השאלה שלכם..."
                className="flex-1 text-right"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                className="h-10 w-10 p-0"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}