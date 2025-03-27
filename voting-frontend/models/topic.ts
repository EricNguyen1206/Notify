import { Option } from "./option";

export interface Topic {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
  options: Option[];
}