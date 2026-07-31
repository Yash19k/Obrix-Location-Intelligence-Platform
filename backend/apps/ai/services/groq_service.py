"""
Groq AI Service — interfaces with the Groq API for location intelligence reports.
Supports model configuration, retry logic, timeout handling, and explicit exception mapping.
"""

import os
import logging
from groq import Groq
from groq.types.chat import ChatCompletion

logger = logging.getLogger(__name__)

class GroqService:
    @classmethod
    def generate_content(cls, prompt: str, timeout_sec: int = 20) -> str:
        """
        Calls Groq Chat Completions API with the configured model.
        Handles rate limits, invalid keys, timeouts, and raises clear user-facing errors.
        """
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.error("[Groq] GROQ_API_KEY environment variable is not configured.")
            raise ValueError("Groq API Key Not Configured. Please set GROQ_API_KEY in backend/.env")

        # Configurable model (default: llama-3.3-70b-versatile, fallback: llama-3.1-8b-instant)
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        logger.info(f"[Groq] Starting report generation with model: {model}")
        
        try:
            # Initialize client with timeout
            client = Groq(api_key=api_key, timeout=timeout_sec)
        except Exception as e:
            logger.error(f"[Groq] Failed to initialize client: {str(e)}")
            raise RuntimeError(f"Failed to initialize Groq client: {str(e)}")

        last_error = None
        for attempt in range(2):
            logger.info(f"[Groq] Sending request (Attempt {attempt + 1}/2)...")
            try:
                completion: ChatCompletion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a Senior Spatial Strategy Partner generating professional McKinsey/Deloitte-style feasibility reports in valid JSON format."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.2,
                    max_tokens=3000,
                    response_format={"type": "json_object"}
                )
                
                content = completion.choices[0].message.content
                if content:
                    logger.info("[Groq] Response received. Report generated successfully.")
                    return content
                
                raise ValueError("Groq API returned an empty completion choice.")

            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                logger.error(f"[Groq] API Error on attempt {attempt + 1}: {str(e)}")
                
                # Check for rate limits (HTTP 429)
                if "rate limit" in err_msg or "429" in err_msg:
                    if attempt == 0:
                        # Fallback to faster, lower-rate-limited model on 429
                        logger.warning("[Groq] Rate limit hit. Falling back to llama-3.1-8b-instant for retry...")
                        model = "llama-3.1-8b-instant"
                    else:
                        raise RuntimeError("Groq API rate limit exceeded. Please retry in a few seconds.")
                
                # Check for unauthorized (HTTP 401)
                elif "401" in err_msg or "unauthorized" in err_msg or "invalid api key" in err_msg:
                    raise ValueError("Invalid Groq API Key. Please verify GROQ_API_KEY in backend/.env")
                
                # Check for timeout
                elif "timeout" in err_msg or "deadline" in err_msg:
                    if attempt == 0:
                        logger.warning("[Groq] Timeout encountered. Retrying with increased timeout...")
                        timeout_sec += 10
                        client = Groq(api_key=api_key, timeout=timeout_sec)
                    else:
                        raise TimeoutError("Groq API request timed out. Please retry.")

        # Raise final captured error
        if last_error:
            raise last_error
        raise RuntimeError("Groq API generation failed after all attempts.")
