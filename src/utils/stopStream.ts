const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://lm-product-dev-be-cyfzfhf3gjgtezhp.eastus-01.azurewebsites.net/v1/";

export async function stopStream(streamId: string) {
  try {
    const response = await fetch(
      `${BASE_URL}chatbot/widget/stop_stream/${streamId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Stop stream response:", result);
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Error while stopping the stream", error);
    return {
      success: false,
      message: "Failed to stop the stream!",
    };
  }
}
