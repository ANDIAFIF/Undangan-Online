"use client";

import { createContext, useContext } from "react";

export const InvitationState = createContext(false);
export const useInvitationOpened = () => useContext(InvitationState);
