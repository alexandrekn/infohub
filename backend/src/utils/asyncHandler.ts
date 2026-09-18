import type { NextFunction, Request, Response } from "express";

type HandlerAsync = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: HandlerAsync) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
