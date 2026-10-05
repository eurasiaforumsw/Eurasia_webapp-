# Enhanced UI Component Library - Usage Guide

This document provides examples of how to use the newly created professional UI components throughout the EFSW website.

## Table of Contents
- [Button](#button)
- [Card](#card)
- [Skeleton](#skeleton)
- [Toast](#toast)
- [Modal](#modal)
- [Input](#input)
- [Badge](#badge)
- [Accordion](#accordion)
- [Progress](#progress)
- [Spinner](#spinner)

---

## Button

Enhanced button component with magnetic hover, ripple effects, and loading states.

```tsx
import { Button } from "@/components/ui/button"

// Default button
<Button>Click me</Button>

// Magnetic hover effect
<Button variant="magnetic">Hover me</Button>

// Loading state
<Button loading>Saving...</Button>

// Different variants
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Disable ripple effect
<Button ripple={false}>No ripple</Button>
```

---

## Card

Interactive card with 3D tilt effect and spotlight hover.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

// Standard card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Card with 3D tilt effect
<Card tilt>
  <CardContent>Tilt me on hover!</CardContent>
</Card>

// Card with spotlight effect
<Card spotlight className="group">
  <CardContent>Move your mouse over me</CardContent>
</Card>

// Card with glow on hover
<Card glowOnHover>
  <CardContent>I glow on hover</CardContent>
</Card>
```

---

## Skeleton

Loading placeholders with shimmer animation.

```tsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonText, 
  SkeletonButton,
  SkeletonTable 
} from "@/components/ui/skeleton"

// Basic skeleton
<Skeleton className="h-10 w-full" />

// Preset components
<SkeletonCard />
<SkeletonAvatar size="lg" />
<SkeletonText lines={3} />
<SkeletonButton />
<SkeletonTable rows={5} columns={4} />

// Custom skeleton
<Skeleton variant="circular" className="w-16 h-16" />
<Skeleton variant="text" className="h-4 w-3/4" />
<Skeleton animation="pulse" />
```

### Example: News card with skeleton loading

```tsx
{loading ? (
  <SkeletonCard />
) : (
  <Card>
    <CardContent>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
    </CardContent>
  </Card>
)}
```

---

## Toast

Non-blocking notifications with spring animations and drag-to-dismiss.

```tsx
import { useToast, toast } from "@/components/ui/toast"

// Inside a component
function MyComponent() {
  const { addToast } = useToast()
  
  const handleSave = async () => {
    try {
      await saveData()
      addToast({
        type: "success",
        title: "Saved successfully",
        description: "Your changes have been saved.",
        duration: 5000
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to save",
        description: error.message
      })
    }
  }
  
  return <Button onClick={handleSave}>Save</Button>
}

// Outside components (global)
toast.success("Profile updated!")
toast.error("Something went wrong")
toast.info("New message received")
toast.warning("Your session will expire soon")
```

---

## Modal

Animated modal with backdrop blur and keyboard support.

```tsx
import { Modal, ModalFooter } from "@/components/ui/modal"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Profile"
        description="Make changes to your profile here"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Name" placeholder="Your name" />
          <Input label="Email" type="email" placeholder="your@email.com" />
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            // Save logic
            setIsOpen(false)
          }}>
            Save changes
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

---

## Input

Enhanced input with floating labels and validation states.

```tsx
import { Input } from "@/components/ui/input"

// Floating label (default)
<Input label="Email" type="email" placeholder="your@email.com" />

// With error
<Input 
  label="Password" 
  type="password" 
  error="Password must be at least 8 characters"
/>

// Static label
<Input 
  label="Username" 
  floatingLabel={false}
  placeholder="Enter username"
/>

// Controlled input
const [email, setEmail] = useState("")
<Input 
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

## Badge

Small status indicators with variants and optional dot.

```tsx
import { Badge } from "@/components/ui/badge"

// Different variants
<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>

// With dot indicator
<Badge variant="success" dot>Active</Badge>
<Badge variant="warning" dot animated>Live</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large</Badge>

// Animated entrance
<Badge animated variant="success">New</Badge>
```

---

## Accordion

Expandable content sections with smooth animations.

```tsx
import { Accordion, AccordionItem } from "@/components/ui/accordion"

<Accordion>
  <AccordionItem title="What is EFSW?" defaultOpen>
    <p>EFSW is a professional network for social workers across Eurasia...</p>
  </AccordionItem>
  
  <AccordionItem title="How do I become a member?">
    <p>You can register through our membership portal...</p>
  </AccordionItem>
  
  <AccordionItem title="What are the benefits?">
    <ul>
      <li>Access to research library</li>
      <li>Networking opportunities</li>
      <li>Professional development</li>
    </ul>
  </AccordionItem>
</Accordion>
```

---

## Progress

Animated progress bar with labels and variants.

```tsx
import { Progress } from "@/components/ui/progress"

// Basic progress
<Progress value={60} max={100} />

// With label
<Progress value={75} showLabel />

// Different variants
<Progress value={100} variant="success" />
<Progress value={50} variant="warning" />
<Progress value={25} variant="error" />

// Different sizes
<Progress value={60} size="sm" />
<Progress value={60} size="lg" />

// Without animation
<Progress value={60} animated={false} />
```

---

## Spinner

Loading indicators with different sizes and variants.

```tsx
import { Spinner, LoadingOverlay } from "@/components/ui/spinner"

// Basic spinner
<Spinner />

// Different sizes
<Spinner size="sm" />
<Spinner size="xl" />

// Different variants
<Spinner variant="primary" />
<Spinner variant="muted" />

// Full screen loading overlay
<LoadingOverlay visible={isLoading} message="Loading..." />

// Example: Button with loading state
<Button disabled={loading}>
  {loading ? <Spinner size="sm" /> : "Submit"}
</Button>
```

---

## Best Practices

### 1. **Consistent Spacing**
Use Tailwind spacing tokens (`space-sm`, `space-md`, `space-lg`) for consistent rhythm.

### 2. **Animation Performance**
- Use `transform` and `opacity` for 60fps animations
- Add `will-change` only when actively animating
- Respect `prefers-reduced-motion` (already handled in components)

### 3. **Loading States**
Always show loading states for async operations:
```tsx
{loading ? <SkeletonCard /> : <Card>{content}</Card>}
```

### 4. **Error Handling**
Provide helpful error messages:
```tsx
<Input 
  label="Email"
  error={errors.email}
  value={email}
/>
```

### 5. **Toast Notifications**
Use appropriate toast types:
- `success` - Confirmations (saved, sent, updated)
- `error` - Failures (network errors, validation)
- `info` - Informational (new message, update available)
- `warning` - Cautions (session expiring, quota limits)

---

## Migration from Old Components

### Buttons
```tsx
// Old
<button className="efsw-button efsw-button--dark">
  Click me
</button>

// New
<Button variant="secondary">
  Click me
</Button>
```

### Cards
```tsx
// Old
<div className="efsw-home-news-card">
  <h3>{title}</h3>
  <p>{summary}</p>
</div>

// New
<Card tilt spotlight>
  <CardHeader>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{summary}</p>
  </CardContent>
</Card>
```

### Loading States
```tsx
// Old
{loading && <div className="spinner">Loading...</div>}

// New
{loading ? <SkeletonCard /> : <Card>{content}</Card>}
```

---

## Component Composition Examples

### News Card with Loading
```tsx
<Card tilt spotlight glowOnHover className="group">
  {loading ? (
    <SkeletonCard />
  ) : (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="info" dot>{category}</Badge>
          <span className="text-xs text-text-muted">{date}</span>
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">{summary}</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          Read more →
        </Button>
      </CardFooter>
    </>
  )}
</Card>
```

### Form with Validation
```tsx
const [form, setForm] = useState({ email: "", password: "" })
const [errors, setErrors] = useState({})
const [loading, setLoading] = useState(false)

<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    value={form.email}
    onChange={(e) => setForm({ ...form, email: e.target.value })}
    error={errors.email}
  />
  
  <Input
    label="Password"
    type="password"
    value={form.password}
    onChange={(e) => setForm({ ...form, password: e.target.value })}
    error={errors.password}
  />
  
  <Button type="submit" loading={loading} className="w-full">
    Sign in
  </Button>
</form>
```

---

For more examples, see the component files in `/components/ui/`.
