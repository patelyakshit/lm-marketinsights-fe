import { useCallback } from "react";
import { useWebSocketContext } from "./useWebSocketContext";
import { ReadyState } from "./usePersistentWebSocket";
import { PinType } from "../types/operations";
import { useMapStore } from "../store/useMapStore";

export const usePinSocketOperations = () => {
  const { sendJsonMessage, readyState, isConnected } = useWebSocketContext();
  const getCurrentMapState = useMapStore((state) => state.getCurrentMapState);
  const pins = useMapStore((state) => state.pins);

  const sendAddPinMessage = useCallback(
    async (pin: PinType, allPins: PinType[]) => {
      if (!isConnected || readyState !== ReadyState.OPEN) {
        console.warn("WebSocket not connected, skipping pin add message");
        return;
      }

      try {
        const mapContext = await getCurrentMapState();

        const updatedPins = allPins.map((p) => ({
          id: p.id,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.title || "Pin",
          note: p.note || "",
          color: p.color,
        }));

        const updatedMapContext = {
          ...mapContext,
          pins: updatedPins,
        };

        // Generate message based on pin address
        const address = pin.address || "the map";
        const message = `add pin to ${address}`;

        const payload = {
          type: "CHAT/SEND",
          payload: {
            message,
            map_context: updatedMapContext,
          },
        };

        sendJsonMessage(payload);
        console.log("Sent ADD_PIN message:", payload);
      } catch (error) {
        console.error("Failed to send add pin message:", error);
      }
    },
    [sendJsonMessage, isConnected, readyState, getCurrentMapState],
  );

  const sendRemovePinMessage = useCallback(
    async (pinIds: string[], remainingPins: PinType[]) => {
      if (!isConnected || readyState !== ReadyState.OPEN) {
        console.warn("WebSocket not connected, skipping pin remove message");
        return;
      }

      try {
        // Get current map state
        const mapContext = await getCurrentMapState();

        const pinsToRemove = pins.filter((pin) => pinIds.includes(pin.id));

        const updatedPins = remainingPins.map((p) => ({
          id: p.id,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          title: p.title || "Pin",
          note: p.note || "",
          color: p.color,
        }));

        const updatedMapContext = {
          ...mapContext,
          pins: updatedPins,
        };

        // Generate message based on pin addresses
        const addresses = pinsToRemove
          .map((pin) => pin.address)
          .filter(Boolean)
          .join(", ");
        const message = addresses
          ? `remove pin from ${addresses}`
          : `remove ${pinIds.length} pin${pinIds.length > 1 ? "s" : ""}`;

        const payload = {
          type: "CHAT/SEND",
          payload: {
            message,
            map_context: updatedMapContext,
          },
        };

        sendJsonMessage(payload);
        console.log("Sent REMOVE_PIN message:", payload);
      } catch (error) {
        console.error("Failed to send remove pin message:", error);
      }
    },
    [sendJsonMessage, isConnected, readyState, getCurrentMapState, pins],
  );

  const sendRemoveAllPinsMessage = useCallback(async () => {
    try {
      const mapContext = await getCurrentMapState();
      const updatedMapContext = {
        ...mapContext,
        pins: [],
      };

      const message = "remove all pins";

      const payload = {
        type: "CHAT/SEND",
        payload: {
          message,
          map_context: updatedMapContext,
        },
      };

      const mapContextPayload = {
        type: "CHAT/MAP_CONTEXT",
        payload: {
          map_context: updatedMapContext,
        },
      };

      sendJsonMessage(payload);
      sendJsonMessage(mapContextPayload);

      if (!isConnected || readyState !== ReadyState.OPEN) {
        console.warn(
          `[sendRemoveAllPinsMessage] Hook reports WebSocket not connected (readyState: ${readyState}). ` +
            "The message will be sent when WebSocket reconnects, or the next chat message will include the updated context with 0 pins.",
        );
      }
    } catch (error) {
      console.error("Failed to send remove all pins message:", error);
    }
  }, [sendJsonMessage, isConnected, readyState, getCurrentMapState]);

  return {
    sendAddPinMessage,
    sendRemovePinMessage,
    sendRemoveAllPinsMessage,
    isConnected,
  };
};
