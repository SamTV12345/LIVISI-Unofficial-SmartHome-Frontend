"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import {CheckIcon} from "lucide-react";

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }) => (
    <CheckboxPrimitive.Root className="bg-green-green h-6 w-6 rounded" {...props}>
        <CheckboxPrimitive.Indicator className="CheckboxIndicator">
            <CheckIcon className="text-white" />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
