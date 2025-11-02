import { Document, Types } from "mongoose";

export interface ISupportReply {
  _id?: Types.ObjectId;
  userId: Types.ObjectId | string;
  message: string;

}

export interface ISupport  {
  userId: Types.ObjectId;
  ticketId?: string;
  supportSubject: string;
  supportMessage: string;
  status?: 'Pending' | 'Resolved';
  replies?: ISupportReply[];

}
