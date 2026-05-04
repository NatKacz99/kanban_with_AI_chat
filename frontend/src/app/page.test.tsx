import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

describe("Logout flow", () => {
    it("logs out and shows login form again", async () => {
        render(<Home />);

        await userEvent.type(screen.getByLabelText(/username/i), "user");
        await userEvent.type(screen.getByLabelText(/password/i), "password");
        await userEvent.click(screen.getByRole("button", {name: /sign in/i}));

        expect(screen.getByRole("button", {name: /logout/i})).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", {name: /logout/i}));

        expect(screen.getByRole("button", {name: /sign in/i})).toBeInTheDocument();
    });
});