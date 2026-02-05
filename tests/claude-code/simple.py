"""
Simple test for Claude Code API endpoint
"""

import requests
import json

BASE_URL = "http://localhost:3000"

def test_claude_code(prompt: str):
    """Test the Claude Code endpoint"""
    print(f"\n{'='*50}")
    print(f"Testing: {prompt}")
    print('='*50)

    response = requests.post(
        f"{BASE_URL}/api/claude-code/test-claude",
        headers={"Content-Type": "application/json"},
        json={"prompt": prompt}
    )

    result = response.json()

    print(f"Status: {response.status_code}")
    print(f"Success: {result.get('success')}")
    print(f"Execution time: {result.get('executionTime')}ms")
    print(f"Output:\n{result.get('output', result.get('error'))}")

    return result

if __name__ == "__main__":
    # Test 1: Simple hello
    test_claude_code("say hello in exactly 3 words")

    # Test 2: Simple task
    test_claude_code("what is 2+2? answer with just the number")

    # Test 3: Creative task
    test_claude_code("describe a sunset in one sentence")
