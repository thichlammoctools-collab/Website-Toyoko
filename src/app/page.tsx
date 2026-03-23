import { redirect } from 'next/navigation';

// Redirect root URL to the products page
export default function Home() {
  redirect('/products');
  return null; // This line will never be reached
}
