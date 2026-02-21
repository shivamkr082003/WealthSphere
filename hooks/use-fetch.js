//for the form submission , suppose crrate accout we need to manage api call
//so we made this file
//this hookis kind of general method for any api call , basically laoding , error , fetching , returning data , settingr espone nd all
//usefetch will accept argument a fucntion so we used cb

import { useState, useCallback } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use useCallback to prevent unnecessary re-renders
  const fn = useCallback(
    async (...args) => {
      // Prevent multiple simultaneous calls
      if (loading) {
        console.warn("API call already in progress, ignoring duplicate call");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await cb(...args);
        setData(response);
        setError(null);
        return response;
      } catch (error) {
        setError(error);
        // Don't show toast here anymore - let components handle their own UI feedback
        console.error("API Error:", error);
        throw error; // Re-throw so components can handle it
      } finally {
        setLoading(false);
      }
    },
    [cb, loading]
  );

  // Reset function to clear state when needed
  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fn, setData, reset };
};

export default useFetch;