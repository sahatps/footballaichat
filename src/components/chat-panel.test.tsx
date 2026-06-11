import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatPanel } from "@/components/chat-panel";
import { mockLiveMatches } from "@/lib/mock-data";

describe("ChatPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the shared AI heading and selected match tag", () => {
    render(<ChatPanel selectedMatch={mockLiveMatches[0]} />);

    expect(screen.getByText("Ask for a match report")).toBeInTheDocument();
    expect(screen.getByText("Manchester City vs Liverpool")).toBeInTheDocument();
  });

  it("shows the returned chat answer after sending a message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Liverpool are pressing higher in the last ten minutes.",
          language: "en",
          needsMatchClarification: false,
          source: "fallback",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<ChatPanel selectedMatch={mockLiveMatches[0]} />);

    await user.type(screen.getByRole("textbox"), "Who has the advantage?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Liverpool are pressing higher in the last ten minutes."),
    ).toBeInTheDocument();
  });
});
