import {render, screen} from "@testing-library/react";
import LoginForm from "@/components/LoginForm";
import userEvent from "@testing-library/user-event";

describe("LoginForm", () => {
    it("show error message when error is set", () => {
        render(<LoginForm
                   username=""
                   password=""
                   error="Invalid credentials"
                   onUsernameChange={() => {}}
                   onPasswordChange={() => {}}
                   onSubmit={() => {}}
            />
        );

        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    it("calls onSubmit when form is submitted", async () => {
        const onSubmit = vi.fn();

        render(
            <LoginForm
                username="user"
                password="password"
                error=""
                onUsernameChange={() => {}}
                onPasswordChange={() => {}}
                onSubmit={onSubmit}
            />
        );

        await userEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(onSubmit).toHaveBeenCalledTimes(1);
    })
    })