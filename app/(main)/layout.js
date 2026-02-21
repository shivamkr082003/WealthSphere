// app/(main)/layout.jsx (ya layout.js)
import { checkUser } from "../../lib/checkUser"; // Path sahi se check karna bhai

export default async function MainLayout({ children }) {
  // Ye function reset ke baad pehli bar koi bhi page load hoga, 
  // toh ye user ko database mein wapas create kar dega.
  const user = await checkUser(); 

  return (
    <div className="flex flex-col min-h-screen">
      {/* Aapka Navbar/Header yahan hoga */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}