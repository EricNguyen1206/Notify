import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from './ui/badge';
import Image from "next/image";
import { Option } from "@/models/option";
import { ThumbsUp, ExternalLink } from "lucide-react";

type Props = {
  option: Option;
  handleVote: (id: string) => void;
  voting: string;
}

export default function OptionCard({option, handleVote, voting}: Props) {
  return (
    <Card key={option.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-xl">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {option.image_url && (
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={option.image_url}
                    alt={option.title}
                    fill
                    className="object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {option.vote_count}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(option.link, "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Link
              </Button>
              <Button
                size="sm"
                onClick={() => handleVote(option.id)}
                disabled={voting === option.id}
              >
                {voting === option.id ? "Voting..." : "Vote"}
              </Button>
            </CardFooter>
          </Card>
  )
}

