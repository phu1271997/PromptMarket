# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

class Contract(gl.Contract):
    """
    Sanity check contract to verify GenLayer Studio deployment and basic state interactions.
    Strictly follows GenLayer v0.2.16 intelligent contract syntax rules.
    """
    counter: u256
    history: TreeMap[str, u256]

    def __init__(self):
        # Rule #2: Do NOT reassign self.history = TreeMap() here. GenVM auto-initializes it.
        self.counter = u256(0)

    @gl.public.write
    def increment(self, name: str) -> u256:
        """
        Increments the global counter and updates the history mapping for a given name.
        """
        self.counter += u256(1)
        self.history[name] = self.counter
        return self.counter

    @gl.public.view
    def get_count(self) -> u256:
        """
        Returns the current global counter value.
        """
        return self.counter

    @gl.public.view
    def get_history(self, name: str) -> u256:
        """
        Returns the counter value stored for the given name, or 0 if it doesn't exist.
        """
        if name in self.history:
            return self.history[name]
        return u256(0)
