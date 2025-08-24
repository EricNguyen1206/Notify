import { MessageCircle, Users, Zap } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

export function ChatEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-white">
      <div className="text-center space-y-6 max-w-md">
        {/* Illustration */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="relative">
              <MessageCircle className="w-16 h-16 text-indigo-600" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute top-4 left-8 w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="absolute bottom-8 right-4 w-6 h-6 bg-cyan-200 rounded-full flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-cyan-600" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-medium text-gray-900">
            Welcome to your chats!
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Select a conversation from the sidebar to start messaging, or create a new chat to connect with your contacts.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Card className="border-gray-200">
            <CardContent className="text-center p-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Direct Messages</h3>
              <p className="text-sm text-gray-500">Chat one-on-one with your contacts</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="text-center p-4">
              <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Channels</h3>
              <p className="text-sm text-gray-500">Collaborate with your teams</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}