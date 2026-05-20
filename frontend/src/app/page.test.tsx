import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

vi.mock("@/lib/api", () => ({
    login: vi.fn(async () => ({ access_token: "test-token" })),
    register: vi.fn(async () => ({})),
    getBoard: vi.fn(async () => ({ columns: [], cards: {} })),
    renameColumn: vi.fn(),
    createCard: vi.fn(),
    deleteCard: vi.fn(),
    moveCardApi: vi.fn(),
    sendAIChat: vi.fn(),
    replaceBoard: vi.fn(async () => ({ columns: [], cards: {} })),
}));

describe("Logout flow", () => {
    it("logs out and shows login form again", async () => {
        render(<Home />);

        await userEvent.type(screen.getByLabelText(/username/i), "user");
        await userEvent.type(screen.getByLabelText(/password/i), "password");
        await userEvent.click(screen.getByRole("button", {name: /sign in/i}));

        await waitFor(() => {
            expect(screen.getByRole("button", {name: /logout/i})).toBeInTheDocument();
        });

        await userEvent.click(screen.getByRole("button", {name: /logout/i}));

        expect(screen.getByRole("button", {name: /sign in/i})).toBeInTheDocument();
    });
});