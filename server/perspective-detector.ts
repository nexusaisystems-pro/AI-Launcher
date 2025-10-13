export function detectPerspectiveFromServerName(serverName: string, existingPerspective?: string | null): string {
  // If existing perspective is already set and valid, keep it
  if (existingPerspective && existingPerspective !== 'Unknown' && existingPerspective.trim() !== '') {
    return existingPerspective;
  }

  const nameLower = serverName.toLowerCase();
  
  // Check for 1PP (first person)
  if (nameLower.includes('1pp') || nameLower.includes('first person')) {
    return '1PP';
  }
  
  // Check for 3PP (third person)
  if (nameLower.includes('3pp') || nameLower.includes('third person')) {
    return '3PP';
  }
  
  // Default to "Both" if we can't determine
  return 'Both';
}
