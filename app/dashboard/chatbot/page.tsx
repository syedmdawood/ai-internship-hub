import { ChatUI } from "@/components/chat-ui"

export default function ChatbotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Career Assistant</h1>
        <p className="text-muted-foreground mt-1">Get personalized career advice and guidance for your freelancing journey.</p>
      </div>
      <ChatUI />
    </div>
  )
}
